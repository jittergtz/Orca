import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartKind = "bar" | "line";

type DataChartProps = {
  title?: string | null;
  type?: string | null;
  data?: unknown;
  xKey?: string | null;
  yKey?: string | null;
};

type ChartRow = Record<string, string | number>;

function parseChartData(data: unknown): ChartRow[] {
  const value = typeof data === "string" ? safeJsonParse(data) : data;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((row): row is ChartRow => {
    return (
      row !== null &&
      typeof row === "object" &&
      !Array.isArray(row) &&
      Object.values(row).some((item) => typeof item === "number")
    );
  });
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getKeys(data: ChartRow[], xKey?: string | null, yKey?: string | null) {
  const first = data[0] ?? {};
  const keys = Object.keys(first);
  const resolvedXKey = xKey && keys.includes(xKey) ? xKey : keys.find((key) => typeof first[key] === "string") ?? keys[0];
  const resolvedYKey = yKey && keys.includes(yKey) ? yKey : keys.find((key) => typeof first[key] === "number");

  return {
    x: resolvedXKey,
    y: resolvedYKey,
  };
}

export function DataChart({ title, type, data, xKey, yKey }: DataChartProps) {
  const rows = parseChartData(data);
  const keys = getKeys(rows, xKey, yKey);
  const chartType: ChartKind = type === "line" ? "line" : "bar";

  if (rows.length === 0 || !keys.x || !keys.y) {
    return (
      <div className="my-6 rounded-lg border border-black/10 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.03] px-4 py-3 text-sm text-neutral-500">
        {title ? <div className="font-medium text-neutral-700 dark:text-neutral-300">{title}</div> : null}
        <div>No chart data available.</div>
      </div>
    );
  }

  return (
    <div className="my-7 rounded-lg border border-black/10 dark:border-white/10 bg-neutral-50/80 dark:bg-white/[0.03] p-4">
      {title ? (
        <div className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          {title}
        </div>
      ) : null}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.22)" />
              <XAxis dataKey={keys.x} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
              <Tooltip />
              <Line type="monotone" dataKey={keys.y} stroke="#5db8ef" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,0.22)" />
              <XAxis dataKey={keys.x} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={36} />
              <Tooltip />
              <Bar dataKey={keys.y} fill="#5db8ef" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
