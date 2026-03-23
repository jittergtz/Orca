

function formatUpdatedAt(timestamp: number) {
  return new Date(timestamp).toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

interface SidebarProps {
  notes: Note[];
  activeId: string | null;
  draftTitle: string;
  draftContent: string;
  setActiveId: (id: string) => void;
  createNote: () => void;
  isOpen: boolean;
}

export default function Sidebar({
  notes,
  activeId,
  draftTitle,
  draftContent,
  setActiveId,
  createNote,
  isOpen
}: SidebarProps) {
  return (
    <aside
      className={` border-2 ml-1.5 mb-2 dark:border-neutral-800/70 dark:bg-neutral-900/50 bg-neutral-50 rounded-[25px] p-1  transition-all duration-300 ease-in-out flex flex-col pt-4 ${
        isOpen
          ? "w-[240px] opacity-100 translate-x-0"
          : "w-0 opacity-0 -translate-x-[220px] overflow-hidden border-none p-0 [&>*]:hidden"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold"></h2>
        <button
          type="button"
          className="primary-button text-sm"
          onClick={() => void createNote()}
        >
          New
        </button>
      </div>

      <ul className="scroll-list min-h-0 flex-1 flex flex-col mt-3">
        {notes.map((note) => {
          const isActive = note.id === activeId;
          const visibleTitle = isActive ? draftTitle : note.title;
          const visibleContent = isActive ? draftContent : note.content;
          return (
            <li key={note.id}>
              <button
                type="button"
                className={`note-item ${isActive ? "note-item-active" : ""}`}
                onClick={() => setActiveId(note.id)}
              >
                <h3 className="truncate text-sm font-semibold">
                  {(visibleTitle || "Untitled").trim() || "Untitled"}
                </h3>
                <p className="truncate text-xs opacity-90">
                  {visibleContent?.replace(/\n/g, " ").trim() || "Empty note"}
                </p>
                <time className="mt-1 block text-[10px] opacity-60">
                  {formatUpdatedAt(note.updatedAt || note.createdAt)}
                </time>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
