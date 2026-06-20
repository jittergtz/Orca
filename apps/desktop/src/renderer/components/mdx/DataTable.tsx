type DataTableProps = {
  title?: string | null;
  headers?: unknown;
  rows?: unknown;
};

function normalizeStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeRows(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => row.map((cell) => String(cell ?? "")));
}

export function DataTable({ title, headers, rows }: DataTableProps) {
  const tableHeaders = normalizeStringList(headers);
  const tableRows = normalizeRows(rows);
  const columnCount = Math.max(
    tableHeaders.length,
    ...tableRows.map((row) => row.length),
    0
  );

  if (columnCount === 0 || tableRows.length === 0) {
    return (
      <div className="my-6 rounded-lg border border-black/10 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.03] px-4 py-3 text-sm text-neutral-500">
        {title ? <div className="font-medium text-neutral-700 dark:text-neutral-300">{title}</div> : null}
        <div>No table data available.</div>
      </div>
    );
  }

  return (
    <div className="my-7 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
      {title ? (
        <div className="border-b border-black/10 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.03] px-4 py-3 text-sm font-semibold text-neutral-800 dark:text-neutral-100">
          {title}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-left text-sm">
          {tableHeaders.length > 0 ? (
            <thead className="bg-neutral-100/80 text-[11px] uppercase tracking-wide text-neutral-500 dark:bg-white/[0.05] dark:text-neutral-400">
              <tr>
                {Array.from({ length: columnCount }).map((_, index) => (
                  <th key={index} className="px-4 py-3 font-semibold">
                    {tableHeaders[index] ?? ""}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {tableRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? "bg-white/60 dark:bg-transparent" : "bg-neutral-50/70 dark:bg-white/[0.025]"}
              >
                {Array.from({ length: columnCount }).map((_, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 align-top text-neutral-700 dark:text-neutral-300">
                    {row[cellIndex] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
