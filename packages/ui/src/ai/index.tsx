"use client";

export function AIResponse({ text }: { text: string }) {
  return <article className="border border-brand bg-brand-muted p-4 text-sm text-text-primary">{text}</article>;
}

export function AIMessage({ role, text }: { role: "user" | "assistant"; text: string }) {
  return (
    <article className="flex flex-col gap-0.5">
      <span className="text-xs text-text-secondary">{role}</span>
      <p className="text-sm text-text-primary">{text}</p>
    </article>
  );
}

export function AISource({ title, href }: { title: string; href?: string }) {
  const className = "inline-flex rounded-full bg-surface-raised px-2 py-1 text-xs font-medium text-text-primary";
  return href ? (
    <a href={href} className={className}>
      {title}
    </a>
  ) : (
    <span className={className}>{title}</span>
  );
}

export function AIInsight({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-secondary">{title}</p>
      <p className="text-sm text-text-primary">{value}</p>
    </div>
  );
}

export function AISuggestion({ text }: { text: string }) {
  return (
    <span className="inline-flex rounded-full border border-brand px-2 py-1 text-xs font-medium text-brand">
      {text}
    </span>
  );
}

export function AIAction({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-brand px-2 py-1 text-xs font-medium text-white hover:bg-brand-dark"
    >
      {label}
    </button>
  );
}

export function AIThinkingIndicator({ label = "AI is thinking" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-2 rounded-full bg-brand" />
      <span className="text-xs text-text-primary">{label}</span>
    </div>
  );
}
