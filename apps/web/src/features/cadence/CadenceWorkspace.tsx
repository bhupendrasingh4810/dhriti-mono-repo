"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardList, LayoutDashboard, Moon, Sun } from "lucide-react";
import { CadenceBoard } from "./components/CadenceBoard";
import { initialActions, initialCards, type CadenceCard } from "./cadence-data";

const navigation = [
  { label: "Retrospectives", icon: LayoutDashboard },
  { label: "Action Items", icon: ClipboardList },
] as const;

export function CadenceWorkspace() {
  const [active, setActive] = useState<(typeof navigation)[number]["label"]>("Retrospectives");
  const [phase, setPhase] = useState(3);
  const [cards, setCards] = useState(initialCards);
  const [actions, setActions] = useState(initialActions);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.dataset.theme;
    root.dataset.theme = dark ? "dark" : "light";
    return () => {
      if (previousTheme) root.dataset.theme = previousTheme;
      else delete root.dataset.theme;
    };
  }, [dark]);

  const addAction = (card: CadenceCard) => {
    setActions((current) => current.some((action) => action.text === card.text) ? current : [...current, { id: Date.now(), text: card.text, owner: card.author, done: false }]);
  };

  return <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-text-primary">
    <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-6">
      <div><p className="text-[10px] font-bold tracking-widest text-brand">CADENCE</p><h1 className="text-lg font-bold">Team rituals</h1></div>
      <div className="flex items-center gap-2"><nav aria-label="Cadence navigation" className="flex rounded-md bg-surface-raised p-1">{navigation.map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => setActive(label)} className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold ${active === label ? "bg-surface text-brand shadow-sm" : "text-text-secondary hover:text-text-primary"}`}><Icon size={14} />{label}</button>)}</nav><button type="button" onClick={() => setDark((value) => !value)} aria-label="Toggle color mode" className="rounded-md border border-border p-2 text-text-secondary hover:bg-surface-raised">{dark ? <Sun size={16} /> : <Moon size={16} />}</button></div>
    </header>
    {active === "Retrospectives" ? <CadenceBoard cards={cards} phase={phase} actions={actions} onPhaseChange={setPhase} onVote={(id) => setCards((current) => current.map((card) => card.id === id ? { ...card, votes: card.votes + 1 } : card))} onCreateAction={addAction} /> : <ActionItems actions={actions} onToggle={(id) => setActions((current) => current.map((action) => action.id === id ? { ...action, done: !action.done } : action))} />}
  </main>;
}

function ActionItems({ actions, onToggle }: { actions: typeof initialActions; onToggle: (id: number) => void }) {
  const completed = actions.filter((action) => action.done).length;
  return <section className="mx-auto w-full max-w-4xl overflow-auto p-4 sm:p-6"><div className="rounded-xl border border-border bg-surface shadow-sm"><header className="flex items-center justify-between border-b border-border p-5"><div><p className="text-[10px] font-bold tracking-widest text-brand">SPRINT 24</p><h2 className="mt-1 text-lg font-bold">Action items</h2></div><span className="text-sm text-text-secondary">{completed}/{actions.length} done</span></header><ul>{actions.map((action) => <li key={action.id} className="flex items-center gap-3 border-b border-border px-5 py-4 last:border-b-0"><button type="button" onClick={() => onToggle(action.id)} aria-label={`Mark ${action.text} as ${action.done ? "incomplete" : "complete"}`} className={`grid size-5 shrink-0 place-items-center rounded border-2 ${action.done ? "border-success bg-success text-text-inverse" : "border-border-strong"}`}>{action.done ? <Check size={13} /> : null}</button><div><p className={`text-sm ${action.done ? "text-text-muted line-through" : "text-text-primary"}`}>{action.text}</p><p className="mt-1 text-xs text-text-secondary">{action.owner}</p></div></li>)}</ul></div></section>;
}
