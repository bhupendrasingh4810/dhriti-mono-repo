export function NotesEmptyState() {
  return (
    <div className="relative">
      <img src="/media/empty_notes.png" alt="" className="max-h-70 max-w-full object-contain" />
      <p className="absolute inset-x-0 bottom-6 text-center text-sm font-medium text-text-secondary">
        No notes available
      </p>
    </div>
  );
}
