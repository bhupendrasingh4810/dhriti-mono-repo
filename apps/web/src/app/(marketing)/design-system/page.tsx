"use server";

import { AIResponse } from "@dhriti/ui";

const foundations = ["Theme tokens", "Form controls", "Data states", "AI responses"];

const workItems = [
  { title: "Finalize workspace roles", status: "In progress", priority: "High" },
  { title: "Publish meeting notes", status: "Ready", priority: "Medium" },
];

export default async function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-background py-8">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Dhriti Enterprise UI</h1>
              <p className="mt-2 text-text-secondary">
                Shared foundation across Home, Connect, Flow, Atlas, Pulse, Nexus, and Control.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
            >
              New Component
            </button>
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="border border-border bg-surface p-6 shadow-sm">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-text-primary">Work Item Cards</h2>
                {workItems.map((item) => (
                  <article key={item.title} className="rounded-md border border-border bg-surface-raised p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-text-primary">{item.title}</h3>
                      <span className="rounded-full bg-brand-muted px-2 py-0.5 text-xs font-semibold text-brand">
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{item.status}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="border border-border bg-surface p-6 shadow-sm">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-text-primary">AI Response</h2>
                <AIResponse text="Dhriti AI summary: Sprint health is at 82% with 3 blocked tasks requiring review." />
              </div>
            </section>
          </div>

          <section className="border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-text-primary">Controls</h2>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
                Meeting note
                <input
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="Capture decision or action item"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {foundations.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-brand-muted px-2.5 py-1 text-sm font-semibold text-brand"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="flex flex-col items-center gap-3 border border-dashed border-border bg-surface p-8 text-center">
            <h2 className="text-lg font-bold text-text-primary">No unresolved blockers</h2>
            <p className="text-text-secondary">Your teams are clear to continue.</p>
            <button
              type="button"
              className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Create Risk Note
            </button>
          </section>

          <p className="text-xs text-text-secondary">Preview route for Dhriti design system foundations.</p>
        </div>
      </div>
    </main>
  );
}
