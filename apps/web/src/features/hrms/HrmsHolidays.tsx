"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ChevronLeft, ChevronRight, Download, History, Mail, Trash2, Upload, X } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import {
  hrmsService,
  type HrmsEmployee,
  type HrmsHoliday,
  type HrmsHolidayBroadcast,
  type HrmsLocation,
} from "@/services/hrms.service";

import { downloadTextFile, holidaysToCsv, holidaysToIcs, parseHolidayCsv, parseHolidayIcs } from "./holiday-io";
import { Badge, Button } from "./components/ui-primitives";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const IMAGE_EDGE = 320;

const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Unable to complete this request. Please try again.");

/** Downscales an uploaded image to a small JPEG data URL so it can live in the row and render as a cell background. */
function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, IMAGE_EDGE / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read this image."));
    };
    image.src = url;
  });
}

function HolidayDialog({
  date,
  holiday,
  siblings,
  locations,
  onSwitch,
  onClose,
  onSave,
  onDelete,
}: {
  date: string;
  holiday: HrmsHoliday | undefined;
  /** Every holiday on this date (one per location), so another location's entry can be opened or added. */
  siblings: HrmsHoliday[];
  locations: HrmsLocation[];
  onSwitch: (holidayId: string | null) => void;
  onClose: () => void;
  onSave: (values: { id?: string; name: string; isHalfDay: boolean; imageUrl: string | null; workLocationId: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(holiday?.name ?? "");
  const [isHalfDay, setIsHalfDay] = useState(holiday?.isHalfDay ?? false);
  const [imageUrl, setImageUrl] = useState<string | null>(holiday?.imageUrl ?? null);
  const [workLocationId, setWorkLocationId] = useState(holiday?.workLocationId ?? "");
  const [nameError, setNameError] = useState("");
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);

  const pickImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setApiError("Please choose an image file.");
    try {
      setImageUrl(await downscaleImage(file));
      setApiError("");
    } catch (error) {
      setApiError(errorMessage(error));
    }
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setApiError("");
    try {
      await action();
    } catch (error) {
      setApiError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (!name.trim()) return setNameError("Holiday name is required.");
    if (name.trim().length > 120) return setNameError("Name must be 120 characters or fewer.");
    void run(() => onSave({ id: holiday?.id, name: name.trim(), isHalfDay, imageUrl, workLocationId: workLocationId || null }));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-text-primary/35 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Holiday"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-surface shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">{holiday ? "Edit holiday" : "Add holiday"}</h2>
            <p className="mt-0.5 text-xs text-text-muted">{new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { dateStyle: "full", timeZone: "UTC" })}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="cursor-pointer rounded-md p-1 text-text-secondary hover:bg-surface-muted">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          {apiError && <p role="alert" className="rounded-md border border-error px-3 py-2 text-sm text-error">{apiError}</p>}
          {siblings.length > 0 && (
            <div className="flex flex-wrap gap-1.5 text-xs">
              {siblings.map((item) => (
                <button key={item.id} type="button" onClick={() => onSwitch(item.id)} className={`cursor-pointer rounded-full border px-2.5 py-1 font-semibold ${item.id === holiday?.id ? "border-brand bg-brand text-text-inverse" : "border-border text-text-primary hover:bg-surface-muted"}`}>
                  {item.name} ({item.workLocation?.name ?? "All locations"})
                </button>
              ))}
              <button type="button" onClick={() => onSwitch(null)} className={`cursor-pointer rounded-full border px-2.5 py-1 font-semibold ${holiday ? "border-border text-text-primary hover:bg-surface-muted" : "border-brand bg-brand text-text-inverse"}`}>
                + Add another
              </button>
            </div>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-text-primary">
              Holiday name <span className="text-error">*</span>
            </span>
            <input
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError("");
              }}
              onKeyDown={(event) => event.key === "Enter" && submit()}
              className={`w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand ${nameError ? "border-error" : "border-border"}`}
            />
            {nameError && <span className="mt-1 block text-xs text-error">{nameError}</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-text-primary">Location</span>
            <select value={workLocationId} onChange={(event) => setWorkLocationId(event.target.value)} className="w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand">
              <option value="">All locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-text-primary">Duration</legend>
            <div className="flex gap-4 text-sm text-text-primary">
              {[
                ["Full day", false],
                ["Half day", true],
              ].map(([label, value]) => (
                <label key={String(label)} className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="holiday-duration" checked={isHalfDay === value} onChange={() => setIsHalfDay(Boolean(value))} className="cursor-pointer" />
                  {String(label)}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-text-primary">Background image (optional)</span>
            {imageUrl ? (
              <div className="relative h-28 overflow-hidden rounded-md border border-border bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }}>
                <button type="button" aria-label="Remove image" onClick={() => setImageUrl(null)} className="absolute right-1.5 top-1.5 cursor-pointer rounded-md bg-surface p-1 text-text-primary shadow-sm">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex h-20 cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-sm text-text-secondary hover:border-brand">
                Click to upload an image
                <input type="file" accept="image/*" onChange={(event) => void pickImage(event)} className="sr-only" />
              </label>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          {holiday ? (
            <button type="button" aria-label="Delete holiday" title="Delete holiday" disabled={busy} onClick={() => void run(onDelete)} className="cursor-pointer rounded-md p-2 text-error hover:bg-surface-muted">
              <Trash2 size={16} />
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SendDialog({
  year,
  organizationId,
  onClose,
  onSent,
}: {
  year: number;
  organizationId: string;
  onClose: () => void;
  onSent: (message: string) => void;
}) {
  const [audience, setAudience] = useState<"ALL" | "SELECTED">("ALL");
  const [employees, setEmployees] = useState<HrmsEmployee[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [changesOnly, setChangesOnly] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<{ subject: string; html: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hrmsService.employees
      .list(organizationId, { pageSize: 100, query: search || undefined, status: "ACTIVE" })
      .then((page) => !cancelled && setEmployees(page.items))
      .catch((loadError) => !cancelled && setError(errorMessage(loadError)));
    return () => {
      cancelled = true;
    };
  }, [organizationId, search]);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const payload = () => ({
    year,
    changesOnly,
    message: message.trim() || undefined,
    ...(audience === "SELECTED" ? { employeeIds: [...selected] } : {}),
  });

  const preview = async () => {
    setBusy(true);
    setError("");
    try {
      setPreviewHtml(await hrmsService.holidays.preview(organizationId, payload()));
    } catch (previewError) {
      setError(errorMessage(previewError));
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (audience === "SELECTED" && selected.size === 0) return setError("Select at least one employee.");
    setBusy(true);
    setError("");
    try {
      const result = await hrmsService.holidays.send(organizationId, payload());
      onSent(`Holiday list sent to ${result.recipientCount} employee${result.recipientCount === 1 ? "" : "s"}${result.failedCount ? ` (${result.failedCount} failed)` : ""}.`);
    } catch (sendError) {
      setError(errorMessage(sendError));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-text-primary/35 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Send holiday list" onClick={(event) => event.stopPropagation()} className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold text-text-primary">Send {year} holiday list</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="cursor-pointer rounded-md p-1 text-text-secondary hover:bg-surface-muted">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {error && <p role="alert" className="rounded-md border border-error px-3 py-2 text-sm text-error">{error}</p>}
          <div className="flex gap-4 text-sm text-text-primary">
            {([["ALL", "All employees"], ["SELECTED", "Selected employees"]] as const).map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="holiday-audience" checked={audience === value} onChange={() => setAudience(value)} className="cursor-pointer" />
                {label}
              </label>
            ))}
          </div>
          {audience === "SELECTED" && (
            <div className="rounded-md border border-border">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employees"
                className="w-full border-b border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
              />
              <ul className="max-h-52 overflow-y-auto">
                {employees.map((employee) => (
                  <li key={employee.id}>
                    <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-muted">
                      <input type="checkbox" checked={selected.has(employee.id)} onChange={() => toggle(employee.id)} className="cursor-pointer" />
                      <span className="font-semibold">{employee.user.name}</span>
                      <span className="text-xs text-text-muted">{employee.user.email}</span>
                    </label>
                  </li>
                ))}
                {employees.length === 0 && <li className="px-3 py-3 text-sm text-text-muted">No employees found.</li>}
              </ul>
              <p className="border-t border-border px-3 py-1.5 text-xs text-text-muted">{selected.size} selected</p>
            </div>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-text-primary">Message (optional)</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-text-primary">
            <input type="checkbox" checked={changesOnly} onChange={(event) => setChangesOnly(event.target.checked)} className="cursor-pointer" />
            Send only holidays changed since the last send
          </label>
          {previewHtml && (
            <div className="overflow-hidden rounded-md border border-border">
              <p className="border-b border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-text-secondary">Subject: {previewHtml.subject}</p>
              <iframe title="Email preview" sandbox="" srcDoc={previewHtml.html} className="h-56 w-full bg-white" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="secondary" onClick={() => void preview()} disabled={busy}>Preview</Button>
          <Button onClick={() => void send()} disabled={busy}>{busy ? "Sending…" : "Send"}</Button>
        </div>
      </div>
    </div>
  );
}

function HistoryDialog({ broadcasts, year, onClose }: { broadcasts: HrmsHolidayBroadcast[]; year: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-text-primary/35 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Send history" onClick={(event) => event.stopPropagation()} className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold text-text-primary">{year} send history</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="cursor-pointer rounded-md p-1 text-text-secondary hover:bg-surface-muted">
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface text-xs text-text-muted">
              <tr>{["Sent", "By", "Audience", "Content", "Delivered"].map((heading) => <th key={heading} className="border-b border-border px-4 py-2 font-semibold">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {broadcasts.map((item) => (
                <tr key={item.id} className="border-b border-border text-text-primary">
                  <td className="px-4 py-2">{new Date(item.sentAt).toLocaleString()}</td>
                  <td className="px-4 py-2">{item.sentBy ?? "—"}</td>
                  <td className="px-4 py-2">{item.audience === "ALL" ? "All employees" : "Selected"}</td>
                  <td className="px-4 py-2">{item.changesOnly ? "Changes only" : "Full list"} ({item.holidayCount})</td>
                  <td className="px-4 py-2">{item.recipientCount}{item.failedCount ? ` · ${item.failedCount} failed` : ""}</td>
                </tr>
              ))}
              {broadcasts.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-text-muted">Nothing has been sent for {year} yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Year-at-a-glance holiday editor: double-click a date to add/edit; the list can be emailed to employees. */
export function HrmsHolidays({ onToast }: { onToast: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [holidays, setHolidays] = useState<HrmsHoliday[]>([]);
  const [broadcasts, setBroadcasts] = useState<HrmsHolidayBroadcast[]>([]);
  const [loadError, setLoadError] = useState("");
  const [active, setActive] = useState<{ date: string; id: string | null } | null>(null);
  const [locations, setLocations] = useState<HrmsLocation[]>([]);
  const [history, setHistory] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  /** Scrolls the calendar pane to the holiday's month and highlights its date for one second. */
  const reveal = (key: string) => {
    document.getElementById(`holiday-month-${key.slice(0, 7)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setFlash(key);
    window.setTimeout(() => setFlash((current) => (current === key ? null : current)), 1000);
  };

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoadError("");
    try {
      const [items, sent] = await Promise.all([
        hrmsService.holidays.list(organizationId, year),
        hrmsService.holidays.broadcasts(organizationId, year),
      ]);
      setHolidays(items);
      setBroadcasts(sent);
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, [organizationId, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (!organizationId) return;
    hrmsService.locations.list(organizationId).then(setLocations).catch(() => setLocations([]));
  }, [organizationId]);

  const byDate = useMemo(() => {
    const map = new Map<string, HrmsHoliday[]>();
    for (const holiday of holidays) map.set(holiday.date.slice(0, 10), [...(map.get(holiday.date.slice(0, 10)) ?? []), holiday]);
    return map;
  }, [holidays]);
  const activeHolidays = active ? (byDate.get(active.date) ?? []) : [];
  const activeHoliday = activeHolidays.find((item) => item.id === active?.id);
  const labelOf = (holiday: HrmsHoliday) =>
    `${holiday.name}${holiday.isHalfDay ? " (half day)" : ""}${holiday.workLocation ? ` (${holiday.workLocation.name})` : ""}`;
  const lastAll = broadcasts.find((broadcast) => broadcast.audience === "ALL");
  const changedSinceSent = lastAll ? holidays.some((holiday) => holiday.updatedAt > lastAll.sentAt) : false;
  const todayKey = dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const save = async (values: { id?: string; name: string; isHalfDay: boolean; imageUrl: string | null; workLocationId: string | null }) => {
    if (!organizationId || !active) return;
    await hrmsService.holidays.save(organizationId, { date: active.date, ...values });
    setActive(null);
    onToast("Holiday saved.");
    await load();
  };
  const remove = async () => {
    if (!organizationId || !activeHoliday) return;
    await hrmsService.holidays.remove(organizationId, activeHoliday.id);
    setActive(null);
    onToast("Holiday deleted.");
    await load();
  };

  const exportAs = (format: "csv" | "ics") => {
    if (format === "csv") downloadTextFile(`holidays-${year}.csv`, holidaysToCsv(holidays), "text/csv");
    else downloadTextFile(`holidays-${year}.ics`, holidaysToIcs(holidays), "text/calendar");
  };

  /** Imports a CSV (date,name,half_day,location) or ICS file; existing date+location rows are updated. */
  const importFile = async (file: File) => {
    if (!organizationId) return;
    try {
      const text = await file.text();
      const items = file.name.toLowerCase().endsWith(".ics") ? parseHolidayIcs(text) : parseHolidayCsv(text);
      if (items.length === 0) return setLoadError("The file contains no holidays.");
      const result = await hrmsService.holidays.importItems(organizationId, items);
      setLoadError(result.errors.length ? `${result.errors.length} row(s) skipped: ${result.errors.slice(0, 3).map((item) => `row ${item.row} – ${item.message}`).join("; ")}` : "");
      onToast(`Imported ${result.created} new and ${result.updated} updated holidays.`);
      await load();
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous year" onClick={() => setYear((value) => value - 1)} className="cursor-pointer rounded-md border border-border p-1.5 text-text-primary hover:bg-surface-muted">
            <ChevronLeft size={16} />
          </button>
          <h2 className="min-w-16 text-center font-display text-xl font-bold text-text-primary">{year}</h2>
          <button type="button" aria-label="Next year" onClick={() => setYear((value) => value + 1)} className="cursor-pointer rounded-md border border-border p-1.5 text-text-primary hover:bg-surface-muted">
            <ChevronRight size={16} />
          </button>
          <span className="ml-2 text-xs text-text-muted">Double-click a date to add or edit a holiday · {holidays.length} holidays</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.ics,text/csv,text/calendar"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void importFile(file);
            }}
          />
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            <Upload size={14} className="mr-1.5 inline" />
            Import
          </Button>
          <Button variant="secondary" onClick={() => exportAs("csv")} disabled={holidays.length === 0}>
            <Download size={14} className="mr-1.5 inline" />
            CSV
          </Button>
          <Button variant="secondary" onClick={() => exportAs("ics")} disabled={holidays.length === 0}>
            <Download size={14} className="mr-1.5 inline" />
            ICS
          </Button>
          <Button variant="secondary" onClick={() => setHistory(true)}>
            <History size={14} className="mr-1.5 inline" />
            History
          </Button>
          {lastAll && <Badge tone={changedSinceSent ? "warning" : "success"}>{changedSinceSent ? "Changed since sent to all" : "Sent to all"}</Badge>}
          <Button onClick={() => setSending(true)} disabled={holidays.length === 0}>
            <Mail size={14} className="mr-1.5 inline" />
            Send holiday list
          </Button>
        </div>
      </div>
      {loadError && <p role="alert" className="rounded-md border border-error px-3 py-2 text-sm text-error">{loadError}</p>}
      <div className="flex min-h-0 flex-1 gap-4">
      <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto pr-1 md:grid-cols-2">
        {MONTHS.map((monthName, month) => {
          const offset = new Date(year, month, 1).getDay();
          const days = new Date(year, month + 1, 0).getDate();
          return (
            <section key={monthName} id={`holiday-month-${year}-${pad(month + 1)}`} className="scroll-mt-1 rounded-lg border border-border bg-surface p-4">
              <h3 className="mb-3 text-base font-bold text-text-primary">{monthName}</h3>
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((weekday, index) => (
                  <span key={index} className="text-xs font-bold text-text-muted">{weekday}</span>
                ))}
                {Array.from({ length: offset }, (_, index) => <span key={`pad-${index}`} />)}
                {Array.from({ length: days }, (_, index) => {
                  const key = dateKey(year, month, index + 1);
                  const dayHolidays = byDate.get(key) ?? [];
                  const holiday = dayHolidays[0];
                  const weekend = (offset + index) % 7 === 0 || (offset + index) % 7 === 6;
                  return (
                    <button
                      key={key}
                      type="button"
                      title={dayHolidays.length ? dayHolidays.map(labelOf).join("\n") : undefined}
                      onDoubleClick={() => setActive({ date: key, id: holiday?.id ?? null })}
                      style={holiday ? (() => { const image = dayHolidays.find((item) => item.imageUrl)?.imageUrl; return image ? { backgroundImage: `url(${image})` } : undefined; })() : undefined}
                      className={`relative aspect-square cursor-pointer select-none rounded-sm border bg-cover bg-center text-sm font-semibold ${
                        holiday ? "border-warning bg-warning/15 text-warning" : weekend ? "border-transparent text-text-muted hover:bg-surface-muted" : "border-transparent text-text-primary hover:bg-surface-muted"
                      } ${key === todayKey ? "ring-1 ring-brand" : ""} ${flash === key ? "ring-2 ring-brand scale-110 z-10 transition-transform" : ""}`}
                    >
                      <span className={dayHolidays.some((item) => item.imageUrl) ? "rounded-sm bg-surface/85 px-0.5 text-text-primary" : undefined}>{index + 1}</span>
                      {dayHolidays.length > 0 && dayHolidays.every((item) => item.isHalfDay) && <span className="absolute bottom-0 right-0.5 text-[8px] font-bold text-warning">½</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <aside className="hidden min-h-0 w-80 shrink-0 flex-col rounded-lg border border-border bg-surface lg:flex">
        <h3 className="shrink-0 border-b border-border px-4 py-3 text-sm font-bold text-text-primary">Holidays in {year}</h3>
        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto text-sm">
          {holidays.map((holiday) => (
            <li key={holiday.id}>
              <button type="button" onClick={() => reveal(holiday.date.slice(0, 10))} className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-muted">
                <span className="w-20 shrink-0 font-semibold text-text-primary">{new Date(holiday.date).toLocaleDateString(undefined, { day: "2-digit", month: "short", weekday: "short", timeZone: "UTC" })}</span>
                <span className="min-w-0 flex-1 truncate text-text-primary">{holiday.name}{holiday.workLocation ? ` (${holiday.workLocation.name})` : ""}</span>
                {holiday.isHalfDay && <Badge tone="warning">½</Badge>}
              </button>
            </li>
          ))}
          {holidays.length === 0 && <li className="px-4 py-3 text-text-muted">No holidays yet.</li>}
        </ul>
      </aside>
      </div>
      {active && (
        <HolidayDialog
          key={`${active.date}-${active.id ?? "new"}`}
          date={active.date}
          holiday={activeHoliday}
          siblings={activeHolidays}
          locations={locations}
          onSwitch={(id) => setActive({ date: active.date, id })}
          onClose={() => setActive(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
      {history && <HistoryDialog broadcasts={broadcasts} year={year} onClose={() => setHistory(false)} />}
      {sending && organizationId && (
        <SendDialog
          year={year}
          organizationId={organizationId}
          onClose={() => setSending(false)}
          onSent={(message) => {
            setSending(false);
            onToast(message);
            void load();
          }}
        />
      )}
    </div>
  );
}
