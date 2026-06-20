import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { DataTable } from "./DataTable";
import { MetricCard } from "./MetricCard";

type MdxArticleRendererProps = {
  content: string;
};

type ComponentName = "DataTable" | "MetricCard" | "DataChart";

type TextSegment = {
  type: "text";
  value: string;
};

type ComponentSegment = {
  type: "component";
  name: ComponentName;
  props: Record<string, unknown>;
  raw: string;
};

type Segment = TextSegment | ComponentSegment;

const ALLOWED_COMPONENTS = new Set<ComponentName>([
  "DataTable",
  "MetricCard",
  "DataChart",
]);

const LazyDataChart = lazy(() =>
  import("./DataChart").then((module) => ({ default: module.DataChart }))
);

function isComponentName(value: string): value is ComponentName {
  return ALLOWED_COMPONENTS.has(value as ComponentName);
}

function findNextComponent(source: string, startIndex: number) {
  const pattern = /<(DataTable|MetricCard|DataChart)\b/g;
  pattern.lastIndex = startIndex;
  const match = pattern.exec(source);

  if (!match || !isComponentName(match[1])) {
    return null;
  }

  const tagStart = match.index;
  const tagEnd = findSelfClosingTagEnd(source, tagStart);

  if (tagEnd === -1) {
    return null;
  }

  return {
    name: match[1],
    start: tagStart,
    end: tagEnd + 1,
    raw: source.slice(tagStart, tagEnd + 1),
  };
}

function findSelfClosingTagEnd(source: string, startIndex: number) {
  let quote: string | null = null;
  let braceDepth = 0;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];
    const previous = source[index - 1];

    if (quote) {
      if (char === quote && previous !== "\\") {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "{") {
      braceDepth += 1;
      continue;
    }

    if (char === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (char === ">" && braceDepth === 0) {
      return source[index - 1] === "/" ? index : -1;
    }
  }

  return -1;
}

function splitMdxSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  while (cursor < content.length) {
    const component = findNextComponent(content, cursor);

    if (!component) {
      segments.push({ type: "text", value: content.slice(cursor) });
      break;
    }

    if (component.start > cursor) {
      segments.push({ type: "text", value: content.slice(cursor, component.start) });
    }

    segments.push({
      type: "component",
      name: component.name,
      props: parseProps(component.raw),
      raw: component.raw,
    });

    cursor = component.end;
  }

  return segments.filter((segment) => segment.type === "component" || segment.value.trim().length > 0);
}

function parseProps(rawTag: string) {
  const body = rawTag
    .replace(/^<[A-Za-z]+/, "")
    .replace(/\/>$/, "")
    .trim();
  const props: Record<string, unknown> = {};
  let cursor = 0;

  while (cursor < body.length) {
    while (/\s/.test(body[cursor] ?? "")) {
      cursor += 1;
    }

    const keyMatch = /^[A-Za-z][A-Za-z0-9_]* /.exec(`${body.slice(cursor)} `);
    if (!keyMatch) {
      break;
    }

    const key = keyMatch[0].trim();
    cursor += key.length;

    while (/\s/.test(body[cursor] ?? "")) {
      cursor += 1;
    }

    if (body[cursor] !== "=") {
      props[key] = true;
      continue;
    }

    cursor += 1;
    while (/\s/.test(body[cursor] ?? "")) {
      cursor += 1;
    }

    const parsed = readPropValue(body, cursor);
    if (!parsed) {
      break;
    }

    props[key] = parsePropValue(parsed.value, parsed.kind);
    cursor = parsed.end;
  }

  return props;
}

function readPropValue(body: string, startIndex: number) {
  const first = body[startIndex];

  if (first === '"' || first === "'") {
    let index = startIndex + 1;
    while (index < body.length) {
      if (body[index] === first && body[index - 1] !== "\\") {
        return {
          kind: "quoted" as const,
          value: body.slice(startIndex + 1, index),
          end: index + 1,
        };
      }
      index += 1;
    }
    return null;
  }

  if (first === "{") {
    let quote: string | null = null;
    let depth = 1;
    let index = startIndex + 1;

    while (index < body.length) {
      const char = body[index];

      if (quote) {
        if (char === quote && body[index - 1] !== "\\") {
          quote = null;
        }
        index += 1;
        continue;
      }

      if (char === '"' || char === "'") {
        quote = char;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          return {
            kind: "expression" as const,
            value: body.slice(startIndex + 1, index),
            end: index + 1,
          };
        }
      }

      index += 1;
    }

    return null;
  }

  const end = body.slice(startIndex).search(/\s/);
  const valueEnd = end === -1 ? body.length : startIndex + end;

  return {
    kind: "bare" as const,
    value: body.slice(startIndex, valueEnd),
    end: valueEnd,
  };
}

function parsePropValue(value: string, kind: "quoted" | "expression" | "bare") {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "";
  }

  if (kind === "expression" || trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = safeJsonParse(trimmed);
    if (parsed !== undefined) {
      return parsed;
    }
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  const numberValue = Number(trimmed);
  if (kind === "bare" && Number.isFinite(numberValue)) {
    return numberValue;
  }

  return kind === "quoted" ? value : trimmed;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function renderComponent(segment: ComponentSegment, key: string) {
  if (segment.name === "DataTable") {
    return <DataTable key={key} {...segment.props} />;
  }

  if (segment.name === "MetricCard") {
    return <MetricCard key={key} {...segment.props} />;
  }

  if (segment.name === "DataChart") {
    return (
      <Suspense
        key={key}
        fallback={
          <div className="my-6 rounded-lg border border-black/10 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.03] px-4 py-3 text-sm text-neutral-500">
            Loading chart...
          </div>
        }
      >
        <LazyDataChart {...segment.props} />
      </Suspense>
    );
  }

  return <p key={key}>{segment.raw}</p>;
}

function renderTextBlocks(text: string, keyPrefix: string) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => renderBlock(block, `${keyPrefix}-${index}`));
}

function renderBlock(block: string, key: string) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  const heading = /^(#{1,3})\s+(.+)$/.exec(lines[0]);
  if (heading) {
    const level = heading[1].length;
    const text = heading[2];

    if (level === 1) {
      return <h2 key={key} className="mt-9 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{renderInline(text, key)}</h2>;
    }

    if (level === 2) {
      return <h3 key={key} className="mt-8 text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{renderInline(text, key)}</h3>;
    }

    return <h4 key={key} className="mt-7 text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{renderInline(text, key)}</h4>;
  }

  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return (
      <ul key={key} className="my-5 space-y-2 pl-5">
        {lines.map((line, index) => (
          <li key={index} className="list-disc pl-1">
            {renderInline(line.replace(/^[-*]\s+/, ""), `${key}-${index}`)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p key={key} className="mb-6">
      {renderInline(lines.join(" "), key)}
    </p>
  );
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-inline-${index}`;

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-black/5 px-1 py-0.5 text-[0.88em] dark:bg-white/10">
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

export function MdxArticleRenderer({ content }: MdxArticleRendererProps) {
  const segments = splitMdxSegments(content);

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="article-body font-sans text-[16px] sm:text-[17px] leading-[1.8] text-neutral-700 dark:text-neutral-300">
      {segments.flatMap((segment, index) => {
        const key = `segment-${index}`;

        if (segment.type === "component") {
          return [renderComponent(segment, key)];
        }

        return renderTextBlocks(segment.value, key);
      })}
    </div>
  );
}
