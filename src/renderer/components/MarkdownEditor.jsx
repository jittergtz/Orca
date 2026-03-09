import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  MessageSquareQuote,
  Strikethrough
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

function wrapSelection(text, start, end, prefix, suffix = prefix, fallback = "text") {
  const selected = text.slice(start, end);
  const hasSelection = selected.length > 0;
  const token = hasSelection ? selected : fallback;
  const next = `${text.slice(0, start)}${prefix}${token}${suffix}${text.slice(end)}`;
  const selectionStart = start + prefix.length;
  const selectionEnd = selectionStart + token.length;

  return {
    value: next,
    selectionStart,
    selectionEnd
  };
}

function transformSelectedLines(text, start, end, lineTransform) {
  const blockStart = text.lastIndexOf("\n", Math.max(start - 1, 0)) + 1;
  const endBoundary = text.indexOf("\n", end);
  const blockEnd = endBoundary === -1 ? text.length : endBoundary;
  const selectedBlock = text.slice(blockStart, blockEnd);
  const transformedBlock = lineTransform(selectedBlock.split("\n")).join("\n");

  return {
    value: `${text.slice(0, blockStart)}${transformedBlock}${text.slice(blockEnd)}`,
    selectionStart: blockStart,
    selectionEnd: blockStart + transformedBlock.length
  };
}

function continueMarkdownLine(text, caret) {
  const lineStart = text.lastIndexOf("\n", Math.max(caret - 1, 0)) + 1;
  const lineEndIndex = text.indexOf("\n", caret);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  const line = text.slice(lineStart, lineEnd);

  if (caret !== lineEnd) {
    return null;
  }

  const taskMatch = line.match(/^(\s*[-*+]\s+\[[ xX]\]\s)(.*)$/);
  if (taskMatch) {
    const prefix = taskMatch[1];
    const content = taskMatch[2];
    if (!content.trim()) {
      return {
        value: `${text.slice(0, lineStart)}${text.slice(lineEnd)}`,
        selectionStart: lineStart,
        selectionEnd: lineStart
      };
    }

    const insertText = `\n${prefix}`;
    return {
      value: `${text.slice(0, caret)}${insertText}${text.slice(caret)}`,
      selectionStart: caret + insertText.length,
      selectionEnd: caret + insertText.length
    };
  }

  const bulletMatch = line.match(/^(\s*[-*+]\s)(.*)$/);
  if (bulletMatch) {
    const prefix = bulletMatch[1];
    const content = bulletMatch[2];
    if (!content.trim()) {
      return {
        value: `${text.slice(0, lineStart)}${text.slice(lineEnd)}`,
        selectionStart: lineStart,
        selectionEnd: lineStart
      };
    }

    const insertText = `\n${prefix}`;
    return {
      value: `${text.slice(0, caret)}${insertText}${text.slice(caret)}`,
      selectionStart: caret + insertText.length,
      selectionEnd: caret + insertText.length
    };
  }

  const orderedMatch = line.match(/^(\s*)(\d+)(\.\s)(.*)$/);
  if (orderedMatch) {
    const indent = orderedMatch[1];
    const current = Number(orderedMatch[2]);
    const marker = orderedMatch[3];
    const content = orderedMatch[4];
    if (!content.trim()) {
      return {
        value: `${text.slice(0, lineStart)}${text.slice(lineEnd)}`,
        selectionStart: lineStart,
        selectionEnd: lineStart
      };
    }

    const insertText = `\n${indent}${current + 1}${marker}`;
    return {
      value: `${text.slice(0, caret)}${insertText}${text.slice(caret)}`,
      selectionStart: caret + insertText.length,
      selectionEnd: caret + insertText.length
    };
  }

  const quoteMatch = line.match(/^(\s*>\s?)(.*)$/);
  if (quoteMatch) {
    const prefix = quoteMatch[1];
    const content = quoteMatch[2];
    if (!content.trim()) {
      return {
        value: `${text.slice(0, lineStart)}${text.slice(lineEnd)}`,
        selectionStart: lineStart,
        selectionEnd: lineStart
      };
    }

    const insertText = `\n${prefix}`;
    return {
      value: `${text.slice(0, caret)}${insertText}${text.slice(caret)}`,
      selectionStart: caret + insertText.length,
      selectionEnd: caret + insertText.length
    };
  }

  return null;
}

function indentSelectedLines(text, start, end, unindent = false) {
  return transformSelectedLines(text, start, end, (lines) => {
    return lines.map((line) => {
      if (!unindent) {
        return `  ${line}`;
      }

      if (line.startsWith("  ")) {
        return line.slice(2);
      }

      if (line.startsWith("\t")) {
        return line.slice(1);
      }

      return line;
    });
  });
}

function getSlashCommandContext(text, caret) {
  const lineStart = text.lastIndexOf("\n", Math.max(caret - 1, 0)) + 1;
  const segment = text.slice(lineStart, caret);
  const match = segment.match(/(^|\s)\/([a-z0-9-]*)$/i);

  if (!match) {
    return null;
  }

  const leadingLength = match[1]?.length || 0;
  const slashOffset = (match.index || 0) + leadingLength;

  return {
    start: lineStart + slashOffset,
    end: caret,
    query: (match[2] || "").toLowerCase()
  };
}

const MARKDOWN_COMMANDS = [
  {
    id: "heading-1",
    label: "Heading 1",
    hint: "#",
    keywords: ["h1", "heading", "title"],
    icon: Heading1
  },
  {
    id: "heading-2",
    label: "Heading 2",
    hint: "##",
    keywords: ["h2", "heading", "subtitle"],
    icon: Heading2
  },
  {
    id: "bold",
    label: "Bold",
    hint: "**text**",
    keywords: ["strong", "emphasis", "b"],
    icon: Bold
  },
  {
    id: "italic",
    label: "Italic",
    hint: "*text*",
    keywords: ["emphasis", "i"],
    icon: Italic
  },
  {
    id: "strike",
    label: "Strikethrough",
    hint: "~~text~~",
    keywords: ["strike", "delete"],
    icon: Strikethrough
  },
  {
    id: "code",
    label: "Code",
    hint: "`code`",
    keywords: ["inline", "block", "snippet"],
    icon: Code
  },
  {
    id: "quote",
    label: "Quote",
    hint: "> quote",
    keywords: ["blockquote", "callout"],
    icon: MessageSquareQuote
  },
  {
    id: "bullets",
    label: "Bullet List",
    hint: "- item",
    keywords: ["list", "unordered", "ul"],
    icon: List
  },
  {
    id: "ordered",
    label: "Numbered List",
    hint: "1. item",
    keywords: ["list", "ordered", "ol"],
    icon: ListOrdered
  },
  {
    id: "task",
    label: "Checklist",
    hint: "- [ ] task",
    keywords: ["todo", "tasks", "checkbox"],
    icon: ListTodo
  },
  {
    id: "link",
    label: "Link",
    hint: "[text](url)",
    keywords: ["url", "hyperlink"],
    icon: Link2
  }
];

function applyMarkdownAction(action, text, start, end) {
  switch (action) {
    case "heading-1":
      return transformSelectedLines(text, start, end, (lines) => {
        return lines.map((line, index) => {
          if (index > 0) {
            return line;
          }

          const normalized = line.replace(/^\s*#{1,6}\s+/, "");
          return line.trimStart().startsWith("# ") ? normalized : `# ${normalized || "Heading"}`;
        });
      });
    case "heading-2":
      return transformSelectedLines(text, start, end, (lines) => {
        return lines.map((line, index) => {
          if (index > 0) {
            return line;
          }

          const normalized = line.replace(/^\s*#{1,6}\s+/, "");
          return line.trimStart().startsWith("## ") ? normalized : `## ${normalized || "Heading"}`;
        });
      });
    case "bold":
      return wrapSelection(text, start, end, "**", "**", "bold");
    case "italic":
      return wrapSelection(text, start, end, "*", "*", "italic");
    case "strike":
      return wrapSelection(text, start, end, "~~", "~~", "strike");
    case "code": {
      const selected = text.slice(start, end);
      if (selected.includes("\n")) {
        return wrapSelection(text, start, end, "```\n", "\n```", "code");
      }
      return wrapSelection(text, start, end, "`", "`", "code");
    }
    case "quote":
      return transformSelectedLines(text, start, end, (lines) => {
        const allQuoted = lines.every((line) => !line.trim() || /^\s*>\s?/.test(line));
        return lines.map((line) => {
          if (!line.trim()) {
            return line;
          }
          return allQuoted ? line.replace(/^\s*>\s?/, "") : `> ${line}`;
        });
      });
    case "bullets":
      return transformSelectedLines(text, start, end, (lines) => {
        const allBulleted = lines.every((line) => !line.trim() || /^\s*[-*+]\s+/.test(line));
        return lines.map((line) => {
          if (!line.trim()) {
            return line;
          }
          if (allBulleted) {
            return line.replace(/^\s*[-*+]\s+/, "");
          }
          return line.replace(/^\s*/, (indent) => `${indent}- `);
        });
      });
    case "ordered":
      return transformSelectedLines(text, start, end, (lines) => {
        const allOrdered = lines.every((line) => !line.trim() || /^\s*\d+\.\s+/.test(line));
        let order = 1;
        return lines.map((line) => {
          if (!line.trim()) {
            return line;
          }
          if (allOrdered) {
            return line.replace(/^\s*\d+\.\s+/, "");
          }
          const indent = line.match(/^\s*/)?.[0] || "";
          const next = line.trimStart().replace(/^([-*+]|\d+\.)\s+/, "");
          const marker = `${order}. `;
          order += 1;
          return `${indent}${marker}${next}`;
        });
      });
    case "task":
      return transformSelectedLines(text, start, end, (lines) => {
        const allTasks = lines.every((line) => !line.trim() || /^\s*[-*+]\s+\[[ xX]\]\s+/.test(line));
        return lines.map((line) => {
          if (!line.trim()) {
            return line;
          }
          if (allTasks) {
            return line.replace(/^\s*[-*+]\s+\[[ xX]\]\s+/, "");
          }
          const indent = line.match(/^\s*/)?.[0] || "";
          const normalized = line.trimStart().replace(/^([-*+]|\d+\.)\s+/, "");
          return `${indent}- [ ] ${normalized}`;
        });
      });
    case "link": {
      const selected = text.slice(start, end);
      if (selected) {
        const wrapped = `[${selected}](https://example.com)`;
        const valueWithLink = `${text.slice(0, start)}${wrapped}${text.slice(end)}`;
        const urlStart = start + wrapped.indexOf("https://");
        return {
          value: valueWithLink,
          selectionStart: urlStart,
          selectionEnd: urlStart + "https://example.com".length
        };
      }
      const fallback = "[link title](https://example.com)";
      const valueWithLink = `${text.slice(0, start)}${fallback}${text.slice(end)}`;
      const titleStart = start + 1;
      return {
        value: valueWithLink,
        selectionStart: titleStart,
        selectionEnd: titleStart + "link title".length
      };
    }
    default:
      return null;
  }
}

function matchesCommand(command, query) {
  if (!query) {
    return true;
  }

  const normalized = query.toLowerCase();
  if (command.label.toLowerCase().includes(normalized) || command.hint.toLowerCase().includes(normalized)) {
    return true;
  }

  return command.keywords.some((keyword) => keyword.includes(normalized));
}

export default function MarkdownEditor({ value, onChange, placeholder }) {
  const textareaRef = useRef(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    return MARKDOWN_COMMANDS.filter((command) => matchesCommand(command, slashQuery));
  }, [slashQuery]);

  const syncSlashMenu = useCallback((nextText, caret, resetIndex = true) => {
    const context = getSlashCommandContext(nextText, caret);
    if (!context) {
      setSlashMenuOpen(false);
      setSlashQuery("");
      setSlashIndex(0);
      return;
    }

    setSlashMenuOpen(true);
    setSlashQuery(context.query);
    if (resetIndex) {
      setSlashIndex(0);
    }
  }, []);

  const applyEditorUpdate = useCallback(
    (transform) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      const result = transform(value, textarea.selectionStart, textarea.selectionEnd);
      if (!result) {
        return;
      }

      onChange(result.value);

      requestAnimationFrame(() => {
        const editor = textareaRef.current;
        if (!editor) {
          return;
        }

        editor.focus();
        editor.setSelectionRange(result.selectionStart, result.selectionEnd);
      });
    },
    [onChange, value]
  );

  const runAction = useCallback(
    (action, fromSlash = false) => {
      applyEditorUpdate((text, start, end) => {
        let workingText = text;
        let workingStart = start;
        let workingEnd = end;

        if (fromSlash && start === end) {
          const context = getSlashCommandContext(text, start);
          if (context) {
            workingText = `${text.slice(0, context.start)}${text.slice(context.end)}`;
            workingStart = context.start;
            workingEnd = context.start;
          }
        }

        return applyMarkdownAction(action, workingText, workingStart, workingEnd);
      });

      setSlashMenuOpen(false);
      setSlashQuery("");
      setSlashIndex(0);
    },
    [applyEditorUpdate]
  );

  const onEditorChange = useCallback(
    (event) => {
      const next = event.target.value;
      onChange(next);
      syncSlashMenu(next, event.target.selectionStart, true);
    },
    [onChange, syncSlashMenu]
  );

  const onCursorUpdate = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    syncSlashMenu(textarea.value, textarea.selectionStart, false);
  }, [syncSlashMenu]);

  const onKeyDown = useCallback(
    (event) => {
      if (slashMenuOpen && event.key === "Escape") {
        event.preventDefault();
        setSlashMenuOpen(false);
        return;
      }

      if (slashMenuOpen && filteredCommands.length > 0) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashIndex((prev) => (prev + 1) % filteredCommands.length);
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          runAction(filteredCommands[slashIndex]?.id, true);
          return;
        }
      }

      const key = event.key.toLowerCase();
      const usesModifier = event.metaKey || event.ctrlKey;

      if (usesModifier && !event.shiftKey && key === "b") {
        event.preventDefault();
        runAction("bold");
        return;
      }

      if (usesModifier && !event.shiftKey && key === "i") {
        event.preventDefault();
        runAction("italic");
        return;
      }

      if (usesModifier && !event.shiftKey && key === "k") {
        event.preventDefault();
        runAction("link");
        return;
      }

      if (usesModifier && event.shiftKey && key === "7") {
        event.preventDefault();
        runAction("ordered");
        return;
      }

      if (usesModifier && event.shiftKey && key === "8") {
        event.preventDefault();
        runAction("bullets");
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        applyEditorUpdate((text, start, end) => indentSelectedLines(text, start, end, event.shiftKey));
        return;
      }

      if (event.key === "Enter") {
        const textarea = textareaRef.current;
        if (!textarea || textarea.selectionStart !== textarea.selectionEnd) {
          return;
        }

        const continuation = continueMarkdownLine(value, textarea.selectionStart);
        if (!continuation) {
          return;
        }

        event.preventDefault();
        onChange(continuation.value);
        setSlashMenuOpen(false);

        requestAnimationFrame(() => {
          const editor = textareaRef.current;
          if (!editor) {
            return;
          }
          editor.setSelectionRange(continuation.selectionStart, continuation.selectionEnd);
        });
      }
    },
    [applyEditorUpdate, filteredCommands, onChange, runAction, slashIndex, slashMenuOpen, value]
  );

  return (
    <div className="markdown-editor-shell ">
      <div className="markdown-editor-body ">
        <textarea
          ref={textareaRef}
          className="editor-textarea  px-1 markdown-input placeholder:text-neutral-500 dark:placeholder:text-neutral-400" 
          value={value}
          placeholder={placeholder}
          onChange={onEditorChange}
          onKeyDown={onKeyDown}
          onClick={onCursorUpdate}
          onKeyUp={onCursorUpdate}
          onBlur={() => setSlashMenuOpen(false)}
          spellCheck
        />

        {slashMenuOpen ? (
          <div className="slash-command-menu" role="listbox" aria-label="Markdown commands">
            {filteredCommands.length === 0 ? (
              <p className="slash-command-empty">No markdown commands found</p>
            ) : (
              filteredCommands.map((command, index) => {
                const Icon = command.icon;
                const isActive = index === slashIndex;
                return (
                  <button
                    key={command.id}
                    type="button"
                    className={`slash-command-item ${isActive ? "slash-command-item-active" : ""}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => runAction(command.id, true)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span className="slash-command-label">
                      <Icon size={14} />
                      {command.label}
                    </span>
                    <span className="slash-command-meta">{command.hint}</span>
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
