"use client";

import { useEffect, useState } from "react";
import { DhritiTextField, DhritiSelectMenu } from "@dhriti/ui";
import { Dialog } from "@dhriti/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  recruitmentService,
  type RecruitmentAccess,
  type RecruitmentGrant,
  type RecruitmentMember,
  type RecruitmentRole,
  type JobOpening,
  type JobOpeningInput,
  type JobOpeningListItem,
  type JobOpeningPage,
} from "@/services/hrms-recruitment.service";
import { Button, Card } from "./components/ui-primitives";
import { RecruitmentCandidates } from "./recruitment-candidates";

const tabs = ["Job openings", "Candidate pipeline", "Interviews"] as const;
type RecruitmentTab = (typeof tabs)[number];
const message = (error: unknown) => (error instanceof Error ? error.message : "Recruitment request failed.");
const label = (value: string) => value.toLowerCase().replaceAll("_", " ");

export function HrmsRecruitment() {
  const { user } = useAuth();
  const org = user?.organization?.id;
  const [tab, setTab] = useState<RecruitmentTab>("Job openings");
  const [access, setAccess] = useState<{ org: string; data?: RecruitmentAccess; error?: string } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!org) return;
    let active = true;
    recruitmentService
      .access(org)
      .then((data) => {
        if (active) setAccess({ org, data });
      })
      .catch((error: unknown) => {
        if (active) setAccess({ org, error: message(error) });
      });
    return () => {
      active = false;
    };
  }, [org, retry]);
  const current = access?.org === org ? access : null;
  return (
    <div className={tab === "Candidate pipeline" ? "flex h-full min-h-0 flex-col gap-5" : "space-y-5"}>
      <div className="sticky top-0 z-10 space-y-5 bg-background">
        <header>
          <h1 className="text-xl font-bold text-text-primary">Recruitment</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage job openings, candidates and interviews.</p>
        </header>
        <nav aria-label="Recruitment sections" className="flex gap-1 overflow-x-auto border-b border-border pb-3">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              aria-current={tab === item ? "page" : undefined}
              onClick={() => setTab(item)}
              className={`shrink-0 cursor-pointer rounded-md px-3.5 py-2 text-sm font-semibold ${tab === item ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-surface-raised"}`}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>
      {!org ? (
        <p role="status">Select an organization.</p>
      ) : current?.error ? (
        <div>
          <p role="alert" className="text-error">
            {current.error}
          </p>
          <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>
            Retry access
          </Button>
        </div>
      ) : !current?.data ? (
        <p role="status">Checking recruitment access…</p>
      ) : !current.data.role ? (
        <Card className="p-5 text-text-secondary">
          Recruitment access is restricted. Contact an organization administrator.
        </Card>
      ) : current.data.role === "INTERVIEWER" ? (
        <Card className="p-5 text-text-secondary">
          Interviewers access their assigned candidate through the private interview link provided by the recruitment
          team.
        </Card>
      ) : tab !== "Job openings" ? (
        <RecruitmentCandidates
          key={`${org}:${tab}`}
          organizationId={org}
          role={current.data.role}
          admin={current.data.admin}
          mode={tab === "Candidate pipeline" ? "pipeline" : "interviews"}
        />
      ) : (
        <>
          {current.data.admin && <RecruitmentGrants organizationId={org} />}
          <Openings organizationId={org} />
        </>
      )}
    </div>
  );
}

function RecruitmentGrants({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const [grants, setGrants] = useState<RecruitmentGrant[] | null>(null);
  const [members, setMembers] = useState<RecruitmentMember[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState("");
  const [role, setRole] = useState<RecruitmentRole>("INTERVIEWER");
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.all([recruitmentService.grants(organizationId), recruitmentService.members(organizationId, query, page)])
      .then(([nextGrants, nextMembers]) => {
        if (active) {
          setGrants(nextGrants);
          setMembers(nextMembers);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason));
      });
    return () => {
      active = false;
    };
  }, [open, organizationId, query, page, refresh]);
  const save = async (operation: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await operation();
      setRefresh((value) => value + 1);
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Manage recruitment access
      </Button>
      {open && (
        <Dialog open title="Manage recruitment access" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Managers manage recruitment. Interviewers must be assigned to each candidate and use their private
              interview link; a grant alone does not provide candidate access.
            </p>
            {error && (
              <p role="alert" className="text-error">
                {error}
              </p>
            )}
            <DhritiTextField
              label="Search members"
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
                setSelected("");
              }}
            />
            <label className="block text-sm font-semibold text-text-secondary">
              Member
              <select
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
                className="mt-1 w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2"
              >
                <option value="">Select a member</option>
                {members.slice(0, 50).map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.user.name} · {member.user.email}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={() => {
                  setPage(page - 1);
                  setSelected("");
                }}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={members.length <= 50}
                onClick={() => {
                  setPage(page + 1);
                  setSelected("");
                }}
              >
                Next
              </Button>
            </div>
            <label className="block text-sm font-semibold text-text-secondary">
              Recruitment role
              <select
                value={role}
                onChange={(event) => setRole(event.target.value === "MANAGER" ? "MANAGER" : "INTERVIEWER")}
                className="mt-1 w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2"
              >
                <option value="INTERVIEWER">Interviewer</option>
                <option value="MANAGER">Recruitment manager</option>
              </select>
            </label>
            <Button
              disabled={!selected || busy}
              onClick={() => void save(() => recruitmentService.grant(organizationId, selected, role))}
            >
              Save access
            </Button>
            <h3 className="font-semibold">Existing grants</h3>
            {!grants ? (
              <p role="status">Loading grants…</p>
            ) : grants.length === 0 ? (
              <p>No individual grants.</p>
            ) : (
              <ul className="divide-y divide-border">
                {grants.map((grant) => (
                  <li key={grant.userId} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span>
                      {grant.user.name} · {label(grant.role)}
                    </span>
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void save(() => recruitmentService.revoke(organizationId, grant.userId))}
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Openings({ organizationId }: { organizationId: string }) {
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: JobOpeningPage; error?: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [openingDetails, setOpeningDetails] = useState<JobOpeningListItem | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const key = `${organizationId}:${page}:${refresh}`;
  useEffect(() => {
    let active = true;
    recruitmentService
      .openings(organizationId, page)
      .then((data) => {
        if (active) setResult({ key, data });
      })
      .catch((reason: unknown) => {
        if (active) setResult({ key, error: message(reason) });
      });
    return () => {
      active = false;
    };
  }, [organizationId, page, key]);
  const data = result?.key === key ? result.data : undefined;
  const changeStatus = async (opening: JobOpening, status: JobOpening["status"]) => {
    setBusy(true);
    setError("");
    try {
      await recruitmentService.status(organizationId, opening, status);
      setRefresh((value) => value + 1);
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Job openings</h2>
        <Button icon="plus" onClick={() => setCreating(true)}>
          Create job opening
        </Button>
      </div>
      <p className="text-sm text-text-secondary">
        Openings are internal only. Public careers and applications are not available yet.
      </p>
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      {result?.key === key && result.error ? (
        <div>
          <p role="alert" className="text-error">
            {result.error}
          </p>
          <Button variant="secondary" onClick={() => setRefresh((value) => value + 1)}>
            Retry openings
          </Button>
        </div>
      ) : !data ? (
        <p role="status">Loading job openings…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Open roles", String(data.open)],
              ["Total applied", String(data.applied)],
              ["Interviews", String(data.interviews)],
              ["Hired", String(data.hired)],
            ].map(([name, value]) => (
              <Card key={name} className="p-4">
                <p className="text-sm text-text-secondary">{name}</p>
                <p className="mt-2 font-semibold">{value}</p>
              </Card>
            ))}
          </div>
          <p className="text-sm text-text-secondary">
            Interviews counts active candidates in the Interview stage, not scheduled appointments. Hired includes
            joined candidates, but excludes declined offers.
          </p>
          <Card className="overflow-hidden">
            {!data.items.length ? (
              <p className="p-5 text-sm text-text-secondary">No job openings yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.items.map((opening) => (
                  <li key={opening.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-semibold">{opening.title}</p>
                      <p className="text-sm text-text-secondary">
                        {opening.department} · {opening.location} · {label(opening.status)}
                      </p>
                      <p className="text-sm text-text-secondary">{opening._count.candidates} applicants</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setOpeningDetails(opening)}>
                        View applicants
                      </Button>
                      {opening.status !== "OPEN" && (
                        <Button disabled={busy} variant="secondary" onClick={() => void changeStatus(opening, "OPEN")}>
                          Mark open
                        </Button>
                      )}
                      {opening.status !== "CLOSED" && (
                        <Button
                          disabled={busy}
                          variant="secondary"
                          onClick={() => void changeStatus(opening, "CLOSED")}
                        >
                          Close opening
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div className="flex items-center justify-end gap-3 text-sm">
            <span>
              {data.total ? (page - 1) * 20 + 1 : 0}–{Math.min(page * 20, data.total)} of {data.total}
            </span>
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="secondary" disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </>
      )}
      {openingDetails && (
        <Dialog open maxWidth="lg" title={`${openingDetails.title} applicants`} onClose={() => setOpeningDetails(null)}>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            <p className="text-sm text-text-secondary">
              {openingDetails.companyName && <span>{openingDetails.companyName} · </span>}
              {openingDetails.openingsCount != null && <span>{openingDetails.openingsCount} openings · </span>}
              {openingDetails._count.candidates} applicants
            </p>
            <p className="text-sm text-text-secondary">
              {openingDetails.department} · {openingDetails.location} · {label(openingDetails.employmentType)} ·{" "}
              {label(openingDetails.workMode)}
            </p>
            {(openingDetails.experienceMin != null || openingDetails.experienceMax != null) && (
              <p className="text-sm text-text-secondary">
                Experience: {openingDetails.experienceMin ?? "—"}–{openingDetails.experienceMax ?? "—"} years
              </p>
            )}
            <p className="text-sm text-text-secondary">
              CTC:{" "}
              {openingDetails.ctcMin || openingDetails.ctcMax
                ? `${openingDetails.ctcCurrency ?? "Currency not set"} ${openingDetails.ctcMin ?? "—"}–${openingDetails.ctcMax ?? "—"}${openingDetails.ctcPeriod ? ` / ${openingDetails.ctcPeriod.toLowerCase()}` : ""}`
                : "Not provided"}
              {openingDetails.ctcNotDisclosed !== false && " (not disclosed)"}
            </p>
            {openingDetails.postedDate && (
              <p className="text-sm text-text-secondary">Posted date: {openingDetails.postedDate.slice(0, 10)}</p>
            )}
            {openingDetails.highlights && (
              <p className="whitespace-pre-wrap text-sm text-text-secondary">Highlights: {openingDetails.highlights}</p>
            )}
            {!!openingDetails.keySkills?.length && (
              <p className="text-sm text-text-secondary">Key skills: {openingDetails.keySkills.join(", ")}</p>
            )}
            <p className="mb-4 whitespace-pre-wrap text-sm text-text-secondary">{openingDetails.description}</p>
            <RecruitmentCandidates
              organizationId={organizationId}
              role="MANAGER"
              admin={false}
              mode="interviews"
              openingId={openingDetails.id}
            />
          </div>
        </Dialog>
      )}
      {creating && (
        <OpeningForm
          onClose={() => setCreating(false)}
          onSave={async (input) => {
            await recruitmentService.create(organizationId, input);
            setPage(1);
            setRefresh((value) => value + 1);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function OpeningForm({ onClose, onSave }: { onClose: () => void; onSave: (input: JobOpeningInput) => Promise<void> }) {
  const [input, setInput] = useState<JobOpeningInput>({
    title: "",
    department: "",
    location: "",
    employmentType: "FULL_TIME",
    workMode: "ONSITE",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [experienceMin, setExperienceMin] = useState("");
  const [experienceMax, setExperienceMax] = useState("");
  const [openingsCount, setOpeningsCount] = useState("");
  const [ctcMin, setCtcMin] = useState("");
  const [ctcMax, setCtcMax] = useState("");
  const [currency, setCurrency] = useState("");
  const [period, setPeriod] = useState<"YEAR" | "MONTH">("YEAR");
  const [notDisclosed, setNotDisclosed] = useState(true);
  const [postedDate, setPostedDate] = useState("");
  const [company, setCompany] = useState("");
  const [highlights, setHighlights] = useState("");
  const [skills, setSkills] = useState("");
  const save = async () => {
    const invalid = Object.fromEntries(
      (["title", "department", "location", "description"] as const)
        .filter((key) => !input[key].trim())
        .map((key) => [key, "This field is required."]),
    );
    for (const [key, value, max] of [
      ["experienceMin", experienceMin, 100],
      ["experienceMax", experienceMax, 100],
      ["openingsCount", openingsCount, 100000],
    ] as const) {
      if (value && (!/^\d+$/.test(value) || Number(value) > max || (key === "openingsCount" && Number(value) < 1))) {
        invalid[key] =
          key === "openingsCount"
            ? "Enter a whole number between 1 and 100000."
            : "Enter a whole number between 0 and 100.";
      }
    }
    if (experienceMin && experienceMax && Number(experienceMin) > Number(experienceMax))
      invalid.experienceMax = "Maximum must be at least the minimum.";
    for (const [key, value] of [
      ["ctcMin", ctcMin],
      ["ctcMax", ctcMax],
    ] as const) {
      if (value && !/^\d{1,12}(\.\d{1,2})?$/.test(value))
        invalid[key] = "Enter a non-negative amount with up to two decimals.";
    }
    if (ctcMin && ctcMax && Number(ctcMin) > Number(ctcMax)) invalid.ctcMax = "Maximum must be at least the minimum.";
    if (!notDisclosed && !ctcMin) invalid.ctcMin = "Enter a minimum amount to disclose CTC.";
    if (!notDisclosed && !ctcMax) invalid.ctcMax = "Enter a maximum amount to disclose CTC.";
    if ((currency || !notDisclosed) && !/^[A-Za-z]{3}$/.test(currency))
      invalid.currency = "Enter a three-letter currency code.";
    const keySkills = skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    if (keySkills.length > 50 || keySkills.some((skill) => skill.length > 80))
      invalid.skills = "Enter up to 50 skills, each at most 80 characters.";
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    setBusy(true);
    setError("");
    try {
      await onSave({
        ...input,
        companyName: company.trim() || null,
        experienceMin: experienceMin ? Number(experienceMin) : null,
        experienceMax: experienceMax ? Number(experienceMax) : null,
        openingsCount: openingsCount ? Number(openingsCount) : null,
        ctcMin: ctcMin || null,
        ctcMax: ctcMax || null,
        ctcCurrency: currency ? currency.toUpperCase() : null,
        ctcPeriod: ctcMin || ctcMax || currency || !notDisclosed ? period : null,
        ctcNotDisclosed: notDisclosed,
        postedDate: postedDate || null,
        highlights: highlights.trim() || null,
        keySkills,
      });
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      title="Create job opening"
      maxWidth="lg"
      onClose={onClose}
      onPrimaryAction={save}
      primaryActionLabel="Create draft"
      isSubmitting={busy}
    >
      <fieldset disabled={busy} className="max-h-[65vh] space-y-4 overflow-y-auto">
        {error && (
          <p role="alert" className="text-error">
            {error}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["title", "Job title", 200],
              ["department", "Department", 120],
              ["location", "Location", 200],
            ] as const
          ).map(([key, name, maxLength]) => (
            <DhritiTextField
              key={key}
              label={name}
              required
              value={input[key]}
              maxLength={maxLength}
              error={errors[key]}
              onChange={(value) => setInput((old) => ({ ...old, [key]: value }))}
            />
          ))}
          <DhritiTextField label="Company name" value={company} onChange={setCompany} maxLength={200} />
          {(
            [
              ["Minimum experience (years)", experienceMin, setExperienceMin, errors.experienceMin],
              ["Maximum experience (years)", experienceMax, setExperienceMax, errors.experienceMax],
              ["Number of openings", openingsCount, setOpeningsCount, errors.openingsCount],
              ["Minimum CTC", ctcMin, setCtcMin, errors.ctcMin],
              ["Maximum CTC", ctcMax, setCtcMax, errors.ctcMax],
              ["CTC currency code", currency, setCurrency, errors.currency],
            ] as const
          ).map(([fieldLabel, value, onChange, fieldError]) => (
            <DhritiTextField
              key={fieldLabel}
              label={fieldLabel}
              value={value}
              onChange={onChange}
              error={fieldError}
              required={!notDisclosed && ["Minimum CTC", "Maximum CTC", "CTC currency code"].includes(fieldLabel)}
            />
          ))}
          <label className="block text-sm font-semibold text-text-secondary">
            CTC period
            <select
              className="mt-1 w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2"
              value={period}
              onChange={(event) => setPeriod(event.target.value === "MONTH" ? "MONTH" : "YEAR")}
            >
              <option value="YEAR">Per year</option>
              <option value="MONTH">Per month</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={notDisclosed} onChange={(event) => setNotDisclosed(event.target.checked)} />
            CTC not disclosed
          </label>
          <label className="block text-sm font-semibold text-text-secondary">
            Posted date
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              value={postedDate}
              onChange={(event) => setPostedDate(event.target.value)}
            />
          </label>
          <DhritiTextField
            label="Applicants"
            value="0"
            readOnly
            onChange={() => {}}
            helperText="Calculated from applications; new openings start at zero."
          />
          <DhritiSelectMenu
            label="Employment type"
            value={input.employmentType}
            open={open === "employment"}
            onOpenChange={(value) => setOpen(value ? "employment" : null)}
            options={["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"].map((value) => ({
              value,
              label: label(value),
            }))}
            onChange={(value) => {
              if (
                value === "FULL_TIME" ||
                value === "PART_TIME" ||
                value === "CONTRACT" ||
                value === "INTERNSHIP" ||
                value === "TEMPORARY"
              )
                setInput((old) => ({ ...old, employmentType: value }));
            }}
          />
        </div>
        <DhritiTextField
          label="Key skills"
          value={skills}
          onChange={setSkills}
          error={errors.skills}
          helperText="Separate skills with commas."
        />
        <label className="block text-sm font-semibold text-text-secondary">
          Job highlights
          <textarea
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
            rows={3}
            maxLength={5000}
            value={highlights}
            onChange={(event) => setHighlights(event.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-text-secondary">
          Job description <span className="text-error">*</span>
          <textarea
            className={`mt-1 w-full rounded-md border bg-surface px-3 py-2 ${errors.description ? "border-error" : "border-border"}`}
            rows={6}
            maxLength={10000}
            value={input.description}
            aria-invalid={!!errors.description}
            onChange={(event) => setInput((old) => ({ ...old, description: event.target.value }))}
          />
        </label>
        {errors.description && (
          <p role="alert" className="text-sm text-error">
            {errors.description}
          </p>
        )}
        <DhritiSelectMenu
          label="Work mode"
          value={input.workMode}
          open={open === "mode"}
          onOpenChange={(value) => setOpen(value ? "mode" : null)}
          options={["ONSITE", "HYBRID", "REMOTE"].map((value) => ({ value, label: label(value) }))}
          onChange={(value) => {
            if (value === "ONSITE" || value === "HYBRID" || value === "REMOTE")
              setInput((old) => ({ ...old, workMode: value }));
          }}
        />
      </fieldset>
    </Dialog>
  );
}
