interface NotesFolderCreateFormProps {
  name: string;
  creating: boolean;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
}

export function NotesFolderCreateForm({ name, creating, onNameChange, onSubmit }: NotesFolderCreateFormProps) {
  return (
    <form
      className="space-y-3 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
        Folder name
        <input
          autoFocus
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Enter folder name"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand"
        />
      </label>
      <button
        type="submit"
        disabled={!name.trim() || creating}
        className="w-full cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {creating ? "Creating..." : "Create folder"}
      </button>
    </form>
  );
}
