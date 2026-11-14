"use client";

export function AIMessage({ role, text }: { role: "user" | "assistant"; text: string }) {
  return (
    <article className="flex flex-col gap-0.5">
      <span className="text-xs text-text-secondary">{role}</span>
      <p className="text-sm text-text-primary">{text}</p>
    </article>
  );
}
