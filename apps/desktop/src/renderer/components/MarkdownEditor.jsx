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
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";

function getSlashCommandContext(editor) {
  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;
  
  // Find the text from the start of the current block to the cursor
  const textBefore = $from.parent.textBetween(0, $from.parentOffset, null, '\n');
  
  // Match a slash followed by any alphanumeric characters at the end of the line
  const match = textBefore.match(/(^|\s)\/([a-z0-9-]*)$/i);

  if (!match) {
    return null;
  }

  const leadingLength = match[1]?.length || 0;
  const slashOffset = (match.index || 0) + leadingLength;

  return {
    start: $from.start() + slashOffset,
    end: $from.pos,
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

function applyTipTapAction(editor, action, contextStart, contextEnd) {
  const chain = editor.chain().focus();
  
  // If triggered from slash menu, delete the /command text first
  if (contextStart !== undefined && contextEnd !== undefined) {
    chain.deleteRange({ from: contextStart, to: contextEnd });
  }

  switch (action) {
    case "heading-1":
      chain.toggleHeading({ level: 1 }).run();
      break;
    case "heading-2":
      chain.toggleHeading({ level: 2 }).run();
      break;
    case "bold":
      chain.toggleBold().run();
      break;
    case "italic":
      chain.toggleItalic().run();
      break;
    case "strike":
      chain.toggleStrike().run();
      break;
    case "code":
      // Basic heuristic: if there's a selection spanning multiple lines, make it a block
      if (!editor.state.selection.empty && editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, '\n').includes('\n')) {
        chain.toggleCodeBlock().run();
      } else {
        chain.toggleCode().run();
      }
      break;
    case "quote":
      chain.toggleBlockquote().run();
      break;
    case "bullets":
      chain.toggleBulletList().run();
      break;
    case "ordered":
      chain.toggleOrderedList().run();
      break;
    case "task":
      chain.toggleTaskList().run();
      break;
    case "link":
      chain.toggleLink({ href: 'https://example.com' }).run();
      break;
    default:
      break;
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
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const slashContextRef = useRef(null);
  
  // Track if we are programmatically updating the editor to avoid cyclical updates
  const isUpdatingValueRef = useRef(false);

  // Parse Initial Content just once safely
  const initialValueRef = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
        codeBlock: false, // We can customize this further if needed
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write in markdown...",
        emptyEditorClass: 'is-editor-empty',
      }),
      Markdown.configure({
        html: false, // No HTML output, just pure markdown
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: initialValueRef.current,
    editorProps: {
      attributes: {
        class: "prose prose-neutral dark:prose-invert max-w-none w-full h-full min-h-[300px] px-1 outline-none prose-p:leading-relaxed prose-pre:bg-neutral-100 dark:prose-pre:bg-neutral-800 prose-pre:border prose-pre:border-black/5 dark:prose-pre:border-white/10 prose-headings:font-semibold prose-a:text-blue-500 hover:prose-a:text-blue-600 tiptap-editor",
      },
    },
    onUpdate: ({ editor }) => {
      // Avoid firing onChange if we are the ones updating the content via useEffect
      if (isUpdatingValueRef.current) return;
      
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
    onSelectionUpdate: ({ editor }) => {
      const context = getSlashCommandContext(editor);
      if (!context) {
        setSlashMenuOpen(false);
        setSlashQuery("");
        setSlashIndex(0);
        slashContextRef.current = null;
        return;
      }

      setSlashMenuOpen(true);
      setSlashQuery(context.query);
      slashContextRef.current = context;
    },
  });

  // Sync external value changes into the editor (e.g. changing notes)
  useEffect(() => {
    if (!editor || value === editor.storage.markdown.getMarkdown()) {
      return;
    }
    
    isUpdatingValueRef.current = true;
    editor.commands.setContent(value);
    isUpdatingValueRef.current = false;
  }, [value, editor]);

  const filteredCommands = useMemo(() => {
    return MARKDOWN_COMMANDS.filter((command) => matchesCommand(command, slashQuery));
  }, [slashQuery]);

  const runAction = useCallback(
    (action, fromSlash = false) => {
      if (!editor) return;

      const contextStart = fromSlash && slashContextRef.current ? slashContextRef.current.start : undefined;
      const contextEnd = fromSlash && slashContextRef.current ? slashContextRef.current.end : undefined;
      
      applyTipTapAction(editor, action, contextStart, contextEnd);

      setSlashMenuOpen(false);
      setSlashQuery("");
      setSlashIndex(0);
      slashContextRef.current = null;
    },
    [editor]
  );

  // Handle Slash Menu Navigation & Global Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (!editor) return;
      
      // If we're focused in the editor and Slash Menu is open, hijack navigation
      if (slashMenuOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          setSlashMenuOpen(false);
          return;
        }

        if (filteredCommands.length > 0) {
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
      }

      // Handle simple Cmd+B / Cmd+I fallbacks if TipTap doesn't catch them
      // (TipTap actually handles a lot of this automatically, but keeping for safety/consistency)
      const key = event.key.toLowerCase();
      const usesModifier = event.metaKey || event.ctrlKey;

      if (usesModifier && !event.shiftKey && key === "k") {
        event.preventDefault();
        runAction("link");
        return;
      }
    };
    
    // We attach to the window specifically for slash menu hijacking ahead of TipTap
    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, [slashMenuOpen, filteredCommands, slashIndex, runAction, editor]);

  return (
    <div className="markdown-editor-shell flex flex-col h-full relative">
      <div className="markdown-editor-body flex-1 min-h-0 relative h-full w-full overflow-y-auto pb-8 pt-4">
        <EditorContent editor={editor} className="h-full focus:outline-none" />

        {slashMenuOpen && editor?.isFocused ? (
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
                    onMouseDown={(event) => event.preventDefault()} // prevent blur
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
