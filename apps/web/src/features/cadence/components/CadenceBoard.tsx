"use client";

import { useState } from "react";
import {
  Check, ChevronRight, CircleEllipsis, Heart, Lightbulb, MessageCircle, Plus, Send,
  Sparkles, ThumbsUp, Users, X,
} from "lucide-react";
import { columns, phases, type CadenceCard } from "../cadence-data";

type Action = { id: number; text: string; owner: string; done: boolean };

type CadenceBoardProps = {
  cards: CadenceCard[];
  phase: number;
  actions: Action[];
  onPhaseChange: (phase: number) => void;
  onVote: (id: number) => void;
  onCreateAction: (card: CadenceCard) => void;
};

const toneClasses = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  brand: "bg-brand-muted text-brand",
};

export function CadenceBoard({ cards, phase, actions, onPhaseChange, onVote, onCreateAction }: CadenceBoardProps) {
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const selected = cards.find((card) => card.id === selectedId);
  const isVote = phase === 3;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="hidden w-52 shrink-0 border-r border-border bg-surface p-4 lg:flex lg:flex-col">
        <p className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-error"><span className="size-2 rounded-full bg-error" />LIVE MEETING</p>
        <div className="border-b border-border py-3">
          <p className="text-sm font-bold text-text-primary">Sprint 24 Retrospective</p>
          <p className="mt-1 text-xs text-text-secondary">Checkout &amp; Billing</p>
          <p className="mt-1 text-xs text-text-muted">Jun 3 – Jun 14</p>
        </div>
        <ol className="mt-3 space-y-1">
          {phases.map((name, index) => (
            <li key={name}>
              <button type="button" onClick={() => onPhaseChange(index)} className={`flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors ${phase === index ? "bg-brand-muted text-brand" : "text-text-secondary hover:bg-surface-raised"}`}>
                <span className={`grid size-5 place-items-center rounded-full border text-[10px] font-bold ${index < phase ? "border-success bg-success/10 text-success" : phase === index ? "border-brand bg-brand text-text-inverse" : "border-border-strong"}`}>{index < phase ? <Check size={12} /> : index + 1}</span>
                <span><span className="block text-xs font-semibold">{name}</span><span className="block text-[10px] text-text-muted">{index < phase ? "Complete" : phase === index ? index === 3 ? "In progress" : "Current phase" : "Up next"}</span></span>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-auto border-t border-border pt-3">
          <p className="text-[10px] font-bold tracking-widest text-text-muted">FACILITATOR TOOLS</p>
          <div className="mt-2 flex items-center justify-between rounded-md border border-border bg-surface-raised p-2 text-xs"><span className="text-text-secondary">Phase timer</span><strong className="text-text-primary">04:32</strong></div>
          <p className="mt-3 text-[10px] text-success">● All changes saved</p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
          <p className="text-xs text-text-muted">Platform X <span className="px-1">/</span> Retrospectives <span className="px-1">/</span> Sprint 24</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-xl font-bold text-text-primary">Sprint 24 Retrospective</h1><span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-muted px-2 py-0.5 text-[10px] font-semibold text-brand"><Sparkles size={11} />Facilitated by you</span></div>
            <div className="flex items-center gap-2 text-xs text-text-secondary"><Users size={15} /><span>6 online</span><button type="button" className="rounded-md border border-border px-3 py-1.5 font-semibold hover:bg-surface-raised">Share</button><button type="button" aria-label="More meeting options" className="rounded-md p-1.5 hover:bg-surface-raised"><CircleEllipsis size={17} /></button></div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[10px] font-semibold"><span className="text-text-muted">PHASE {phase + 1} OF 7</span><div className="flex w-36 gap-1">{phases.map((item, index) => <span key={item} className={`h-1 flex-1 rounded ${index <= phase ? "bg-brand" : "bg-surface-raised"}`} />)}</div><span className="text-brand">{phases[phase]}</span></div>
        </header>

        <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6">
          <span className="grid size-9 place-items-center rounded-md bg-brand-muted text-brand">{isVote ? <Heart size={18} /> : <Sparkles size={18} />}</span>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-bold tracking-widest text-text-muted">{isVote ? "VOTING ROUND" : "CURRENT PROMPT"}</p><p className="truncate text-sm font-semibold text-text-primary">{isVote ? "Vote on the ideas that would make the biggest difference." : "What went well, what didn’t, and what can we improve?"}</p></div>
          <div className="hidden items-center gap-2 border-l border-border pl-3 sm:flex"><strong className="grid size-8 place-items-center rounded-full border-2 border-brand text-sm text-brand">{isVote ? 3 : "∞"}</strong><span className="text-xs text-text-secondary">{isVote ? "votes remaining" : "ideas welcome"}</span></div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="mb-3 flex items-center justify-between"><div className="flex gap-1 rounded-md bg-surface-raised p-1"><button type="button" className="rounded px-2 py-1 text-xs font-semibold text-text-primary shadow-sm">All cards <span className="text-text-muted">{cards.length}</span></button><button type="button" className="px-2 py-1 text-xs text-text-secondary">My cards <span>2</span></button></div><span className="text-xs text-text-muted">● Maya is typing</span></div>
          <div className="grid min-w-[720px] grid-cols-4 gap-3">
            {columns.map((column) => {
              const columnCards = cards.filter((card) => card.column === column.name);
              return <section key={column.name} className="min-h-[480px] rounded-lg border-t-4 border-border bg-surface/80 p-2 shadow-sm">
                <header className="flex items-center gap-2 py-1"><span className={`grid size-7 place-items-center rounded-md ${toneClasses[column.tone]}`}>{column.name === "Ideas" ? <Lightbulb size={15} /> : column.name === "Kudos" ? <Heart size={15} /> : <Sparkles size={15} />}</span><div className="min-w-0 flex-1"><h2 className="text-xs font-bold text-text-primary">{column.name}</h2><p className="text-[10px] text-text-muted">{column.subtitle}</p></div><span className="rounded-full bg-surface-raised px-1.5 py-0.5 text-[10px] text-text-muted">{columnCards.length}</span></header>
                <button type="button" className="my-2 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border-strong py-1.5 text-xs text-text-secondary hover:bg-surface-raised"><Plus size={14} />Add feedback</button>
                <div className="space-y-2">{columnCards.map((card) => <FeedbackCard key={card.id} card={card} selected={card.id === selectedId} onSelect={() => setSelectedId(card.id)} onVote={() => onVote(card.id)} />)}</div>
              </section>;
            })}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border bg-surface px-4 py-2 sm:px-6"><span className="hidden text-xs text-text-secondary sm:block"><span className="mr-1 text-success">●</span>Live updates on</span><span className="hidden text-xs text-text-secondary md:block">Anonymous voting enabled</span><button type="button" onClick={() => onPhaseChange(Math.min(phases.length - 1, phase + 1))} className="ml-auto inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-text-inverse hover:bg-brand-dark">{phase === phases.length - 1 ? "Send follow-up" : `End voting & start ${phases[Math.min(phases.length - 1, phase + 1)]}`}<ChevronRight size={15} /></button></footer>
      </section>

      <DetailPanel card={selected} actionCount={actions.length} onClose={() => setSelectedId(null)} onCreateAction={() => selected && onCreateAction(selected)} />
    </div>
  );
}

function FeedbackCard({ card, selected, onSelect, onVote }: { card: CadenceCard; selected: boolean; onSelect: () => void; onVote: () => void }) {
  return <article onClick={onSelect} className={`cursor-pointer rounded-md border bg-surface p-3 shadow-sm transition hover:border-border-strong ${selected ? "border-brand ring-2 ring-brand/20" : "border-border"}`}>
    {card.tag ? <span className={`mb-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${card.tag === "Most voted" ? "bg-warning/10 text-warning" : "bg-surface-raised text-text-secondary"}`}>{card.tag === "Most voted" && <Sparkles size={11} />}{card.tag}</span> : null}
    <p className="text-xs leading-relaxed text-text-primary">{card.text}</p>
    <footer className="mt-3 flex items-center justify-between border-t border-border pt-2"><span className="text-[10px] font-semibold text-text-secondary">{card.author}</span><span className="flex items-center gap-2 text-[10px] text-text-muted"><span className="inline-flex items-center gap-1"><MessageCircle size={12} />{card.comments}</span><button type="button" onClick={(event) => { event.stopPropagation(); onVote(); }} className={`inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-brand-muted hover:text-brand ${card.votes > 2 ? "bg-brand-muted text-brand" : ""}`}><ThumbsUp size={12} />{card.votes}</button></span></footer>
  </article>;
}

function DetailPanel({ card, actionCount, onClose, onCreateAction }: { card?: CadenceCard; actionCount: number; onClose: () => void; onCreateAction: () => void }) {
  return <aside className="hidden w-72 shrink-0 border-l border-border bg-surface xl:flex xl:flex-col">
    <header className="flex items-center justify-between border-b border-border px-4 py-3"><strong className="text-sm text-text-primary">Card details</strong><button type="button" onClick={onClose} aria-label="Close card details" className="rounded p-1 text-text-secondary hover:bg-surface-raised"><X size={16} /></button></header>
    {card ? <><div className="border-b border-border p-4">{card.tag === "Most voted" ? <span className="inline-flex items-center gap-1 rounded bg-warning/10 px-2 py-1 text-[10px] font-bold text-warning"><Sparkles size={11} />Most voted</span> : null}<p className="mt-3 text-sm leading-relaxed text-text-primary">{card.text}</p><p className="mt-4 text-xs text-text-secondary">Added by <strong>{card.author}</strong> today at 10:08</p></div><div className="border-b border-border p-4 text-xs"><strong className="text-brand">{card.votes} votes</strong><p className="mt-1 text-text-muted">from 4 participants</p></div><div className="flex-1 p-4"><h2 className="text-xs font-bold text-text-primary">Discussion <span className="ml-1 rounded-full bg-surface-raised px-1.5 py-0.5 text-text-muted">{card.comments + 1}</span></h2><p className="mt-3 text-xs leading-relaxed text-text-secondary"><strong>Maya Lin</strong><br />Especially useful for the database migration. We should use it for hotfixes too.</p><p className="mt-3 text-xs leading-relaxed text-text-secondary"><strong>Jay Desai</strong><br />I can add a shorter hotfix path this week.</p></div><div className="border-t border-border p-3"><div className="flex rounded-md border border-border px-2 py-1"><input aria-label="Add to discussion" placeholder="Add to the discussion..." className="min-w-0 flex-1 bg-transparent px-1 text-xs text-text-primary outline-none placeholder:text-text-muted" /><button type="button" aria-label="Send comment" className="text-brand"><Send size={15} /></button></div><button type="button" onClick={onCreateAction} className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-brand px-2 py-2 text-xs font-semibold text-brand hover:bg-brand-muted"><Check size={14} />Convert to action item ({actionCount})</button></div></> : <div className="m-auto p-5 text-center"><CircleEllipsis className="mx-auto text-text-muted" size={28} /><p className="mt-3 text-sm font-semibold text-text-primary">Select a card</p><p className="mt-1 text-xs leading-relaxed text-text-secondary">Card details, comments and linked actions will appear here.</p></div>}
  </aside>;
}
