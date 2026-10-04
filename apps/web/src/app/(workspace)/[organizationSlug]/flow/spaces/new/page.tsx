"use client";

import { ReactNode, useMemo, useState, type Dispatch, type SetStateAction } from "react";
// import { Button, Icon, PageHeader, Toast } from "./FlowShared";
// import { useFlowStore } from "./FlowStore";

type Template = {
    id: string;
    name: string;
    type: "Default" | "Custom";
    description: string;
    features: string[];
    workflows: string[];
    workTypes: string[];
    views: string[];
};

export interface FlowWorkspace {
    id: string;
    name: string;
    owner: string;
    purpose: string;
    visibility: string;
    template: string;
    members: number;
}

const DEFAULT_TEMPLATES: Template[] = [
    {
        id: "kanban",
        name: "Kanban",
        type: "Default",
        description: "A continuous-flow space for teams that prioritize and deliver work without fixed planning periods.",
        features: ["Visual work board", "Work-in-progress limits", "Backlog", "Reports"],
        workflows: ["To do → In progress → Done"],
        workTypes: ["Task", "Bug", "Improvement"],
        views: ["Board", "List", "Calendar"],
    },
    {
        id: "scrum",
        name: "Scrum",
        type: "Default",
        description: "A structured delivery space with a backlog, planned cycles, estimates, and team velocity.",
        features: ["Prioritized backlog", "Planned cycles", "Estimation", "Velocity reports"],
        workflows: ["Backlog → Ready → In progress → Review → Done"],
        workTypes: ["Story", "Task", "Bug", "Milestone"],
        views: ["Backlog", "Board", "List", "Timeline"],
    },
];

export function Icon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
    const paths: Record<string, ReactNode> = {
        plus: (
            <>
                <path d="M12 5v14M5 12h14" />
            </>
        ),
        search: (
            <>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
            </>
        ),
        filter: (
            <>
                <path d="M4 6h16M7 12h10M10 18h4" />
            </>
        ),
        chevron: (
            <>
                <path d="m9 18 6-6-6-6" />
            </>
        ),
        dots: (
            <>
                <circle cx="5" cy="12" r="1" fill="currentColor" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
                <circle cx="19" cy="12" r="1" fill="currentColor" />
            </>
        ),
        close: (
            <>
                <path d="m6 6 12 12M18 6 6 18" />
            </>
        ),
        check: (
            <>
                <path d="m5 12 4 4L19 6" />
            </>
        ),
        arrow: (
            <>
                <path d="M5 12h14M14 7l5 5-5 5" />
            </>
        ),
        calendar: (
            <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18" />
            </>
        ),
    };
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths[name] ?? paths.dots}
        </svg>
    );
}

export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
    children,
}: {
    eyebrow?: string;
    title: string;
    description: string;
    actions?: ReactNode;
    children?: ReactNode;
}) {
    return (
        <header className="border-b border-slate-200 bg-white px-6 pt-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                    {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-brand">{eyebrow}</p>}
                    <h1 className="font-display text-xl font-bold text-slate-900">{title}</h1>
                    <p className="mt-1 text-xs text-slate-500">{description}</p>
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
            {children}
        </header>
    );
}

export function Button({
    children,
    onClick,
    variant = "secondary",
    disabled = false,
}: {
    children: ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "quiet" | "danger";
    disabled?: boolean;
}) {
    const variants = {
        primary: "border-brand bg-brand text-white hover:bg-brand-dark",
        secondary: "border-slate-200 bg-white text-slate-700 hover:border-brand/30 hover:text-brand",
        quiet: "border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800",
        danger: "border-red-200 bg-white text-red-600 hover:bg-red-50",
    };
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]}`}
        >
            {children}
        </button>
    );
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-[90] flex max-w-sm items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-xl"
        >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand">
                <Icon name="check" className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs font-semibold">{message}</p>
            <button aria-label="Dismiss notification" onClick={onClose} className="ml-2 text-slate-400 hover:text-white">
                <Icon name="close" className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

function TemplatePreview({ template }: { template: Template }) {
    const columns =
        template.id === "scrum" ? ["Ready", "In progress", "Review", "Done"] : ["To do", "In progress", "Done"];
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-4 shadow-inner">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-md bg-brand" />
                    <span className="text-xs font-bold text-slate-700">Space board preview</span>
                </div>
                <span className="text-[9px] text-slate-400">Dhriti Flow</span>
            </div>
            <div className={`grid gap-2 ${columns.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
                {columns.map((column, columnIndex) => (
                    <div key={column} className="rounded-lg bg-slate-200/70 p-2">
                        <div className="mb-2 flex justify-between text-[8px] font-bold uppercase text-slate-500">
                            <span>{column}</span>
                            <span>{columnIndex + 2}</span>
                        </div>
                        {Array.from({ length: columnIndex === columns.length - 1 ? 1 : 2 }, (_, index) => (
                            <div key={index} className="mb-1.5 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
                                <div className="h-1.5 w-8 rounded bg-brand/20" />
                                <div className="mt-2 h-1.5 rounded bg-slate-200" />
                                <div className="mt-1 h-1.5 w-2/3 rounded bg-slate-100" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function SpacesHub() {
    const INITIAL_WORKSPACES: FlowWorkspace[] = [
        {
            id: "product-engineering",
            name: "Product Engineering",
            owner: "Rahul Sharma",
            purpose: "Build and operate customer-facing products.",
            visibility: "Organization",
            template: "Product delivery",
            members: 32,
        },
        {
            id: "customer-operations",
            name: "Customer Operations",
            owner: "Priya Nair",
            purpose: "Deliver responsive customer service.",
            visibility: "Organization",
            template: "Service intake",
            members: 24,
        },
        {
            id: "people-operations",
            name: "People Operations",
            owner: "Sneha Verma",
            purpose: "Support employees and hiring.",
            visibility: "Organization",
            template: "Team operations",
            members: 14,
        },
        {
            id: "internal-it",
            name: "Internal IT",
            owner: "Amit Singh",
            purpose: "Operate internal systems and access.",
            visibility: "Private",
            template: "Service intake",
            members: 18,
        },
    ];
    const [workspaces, setWorkspaces] = useState<FlowWorkspace[]>(INITIAL_WORKSPACES);
    // const { workspaces, createWorkspace } = useFlowStore();
    const [phase, setPhase] = useState<"catalog" | "detail" | "create" | "board">("catalog");
    const [selected, setSelected] = useState<Template>(DEFAULT_TEMPLATES[0]);
    const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
    const [customOpen, setCustomOpen] = useState(false);
    const [customName, setCustomName] = useState("");
    const [customDescription, setCustomDescription] = useState("");
    const [customStatuses, setCustomStatuses] = useState("To do, In progress, Done");
    const [customTypes, setCustomTypes] = useState("Task, Request");
    const [customViews, setCustomViews] = useState(["Board", "List"]);
    const [createStep, setCreateStep] = useState(1);
    const [spaceName, setSpaceName] = useState("");
    const [management, setManagement] = useState("Team managed");
    const [access, setAccess] = useState("Open");
    const [key, setKey] = useState("");
    const [statuses, setStatuses] = useState<string[]>([]);
    const [workTypes, setWorkTypes] = useState<string[]>([]);
    const [views, setViews] = useState<string[]>([]);
    const [newConfig, setNewConfig] = useState<Record<string, string>>({});
    const [toast, setToast] = useState("");
    const [activeBoardView, setActiveBoardView] = useState("");
    const [boardItems, setBoardItems] = useState([
        "Set up the first team workflow",
        "Invite space collaborators",
        "Define the initial delivery goal",
    ]);
    const templates = useMemo(() => [...DEFAULT_TEMPLATES, ...customTemplates], [customTemplates]);

    const selectTemplate = (template: Template) => {
        setSelected(template);
        setStatuses(template.workflows[0].split(" → "));
        setWorkTypes(template.workTypes);
        setViews(template.views);
        setPhase("create");
    };

    const saveCustom = () => {
        const template: Template = {
            id: `custom-${Date.now()}`,
            name: customName,
            type: "Custom",
            description: customDescription || "A custom space template configured for your team.",
            features: ["Custom workflow", "Custom work types", "Flexible views"],
            workflows: [
                customStatuses
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .join(" → "),
            ],
            workTypes: customTypes
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            views: customViews,
        };
        setCustomTemplates((current) => [...current, template]);
        setCustomOpen(false);
        setCustomName("");
        selectTemplate(template);
    };
    const updateName = (value: string) => {
        setSpaceName(value);
        setKey(
            value
                .split(/\s+/)
                .filter(Boolean)
                .map((word) => word[0])
                .join("")
                .slice(0, 5)
                .toUpperCase(),
        );
    };
    const finish = () => {
        setWorkspaces((prev) => [
            ...prev,
            {
                name: spaceName,
                owner: "Rahul Sharma",
                purpose: selected.description,
                visibility: access,
                template: selected.name,
                id: spaceName.toLowerCase().replace(/\s+/g, "-"),
                members: 1,
            },
        ]);
        setPhase("board");
        setToast(`${spaceName} space created`);
    };

    if (phase === "board")
        return (
            <div className="flex h-full flex-col overflow-hidden bg-slate-50">
                <PageHeader
                    eyebrow={`Spaces / ${spaceName}`}
                    title={spaceName}
                    description={`${selected.name} template · ${management} · ${access}`}
                    actions={
                        <>
                            <Button onClick={() => setPhase("catalog")}>All spaces</Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setBoardItems((current) => [...current, `New ${workTypes[0] ?? "work item"}`]);
                                    setToast("Work item added to the first column");
                                }}
                            >
                                <Icon name="plus" />
                                Create work item
                            </Button>
                        </>
                    }
                >
                    <nav className="mt-5 flex gap-1">
                        {views.map((view, index) => (
                            <button
                                key={view}
                                onClick={() => setActiveBoardView(view)}
                                className={`border-b-2 px-3 py-2 text-xs font-semibold ${(activeBoardView || views[0]) === view ? "border-brand text-brand" : "border-transparent text-slate-500"}`}
                            >
                                {view}
                            </button>
                        ))}
                    </nav>
                </PageHeader>
                <main className="flex-1 overflow-x-auto p-5">
                    <div className="mb-3 text-xs font-semibold text-slate-500">{activeBoardView || views[0]} view</div>
                    <div className="flex min-w-max gap-3">
                        {statuses.map((status, index) => (
                            <section key={status} className="w-64 rounded-xl bg-slate-100 p-3">
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="text-xs font-bold">{status}</h2>
                                    <span className="text-[10px] text-slate-400">{index === 0 ? boardItems.length : 0}</span>
                                </div>
                                {index === 0 &&
                                    boardItems.map((title, itemIndex) => (
                                        <article
                                            key={`${title}-${itemIndex}`}
                                            className="mb-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                                        >
                                            <span className="text-[9px] font-bold uppercase text-brand">
                                                {key}-{itemIndex + 1} · {workTypes[itemIndex % Math.max(workTypes.length, 1)] ?? "Task"}
                                            </span>
                                            <p className="mt-2 text-xs font-semibold">{title}</p>
                                        </article>
                                    ))}
                                <button
                                    onClick={() => {
                                        setBoardItems((current) => [...current, `New ${workTypes[0] ?? "work item"}`]);
                                        setToast("Work item added");
                                    }}
                                    className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-brand"
                                >
                                    <Icon name="plus" className="h-3 w-3" />
                                    Add work item
                                </button>
                            </section>
                        ))}
                    </div>
                </main>
                {toast && <Toast message={toast} onClose={() => setToast("")} />}
            </div>
        );

    if (phase === "create")
        return (
            <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50">
                <PageHeader
                    eyebrow={`Spaces / ${selected.name}`}
                    title="Create your space"
                    description={`Step ${createStep} of 3 · Configure a space from the ${selected.name} template.`}
                    actions={<Button onClick={() => setPhase("detail")}>Cancel</Button>}
                />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-6 flex gap-2">
                            {[1, 2, 3].map((step) => (
                                <div
                                    key={step}
                                    className={`h-1.5 flex-1 rounded-full ${step <= createStep ? "bg-brand" : "bg-slate-200"}`}
                                />
                            ))}
                        </div>
                        {createStep === 1 && (
                            <section className="rounded-xl border border-slate-200 bg-white p-6">
                                <h2 className="font-display text-lg font-bold">Space details</h2>
                                <div className="mt-5 space-y-4">
                                    <label className="block">
                                        <span className="mb-1 block text-xs font-semibold">Name</span>
                                        <input
                                            autoFocus
                                            value={spaceName}
                                            onChange={(event) => updateName(event.target.value)}
                                            placeholder="Example: Growth Operations"
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                                        />
                                    </label>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label>
                                            <span className="mb-1 block text-xs font-semibold">How space is managed</span>
                                            <select
                                                value={management}
                                                onChange={(event) => setManagement(event.target.value)}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            >
                                                <option>Team managed</option>
                                                <option>Company managed</option>
                                            </select>
                                        </label>
                                        <label>
                                            <span className="mb-1 block text-xs font-semibold">Access</span>
                                            <select
                                                value={access}
                                                onChange={(event) => setAccess(event.target.value)}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            >
                                                <option>Private</option>
                                                <option>Limited</option>
                                                <option>Open</option>
                                            </select>
                                        </label>
                                    </div>
                                    <label className="block">
                                        <span className="mb-1 block text-xs font-semibold">Key</span>
                                        <input
                                            value={key}
                                            onChange={(event) =>
                                                setKey(
                                                    event.target.value
                                                        .toUpperCase()
                                                        .replace(/[^A-Z0-9]/g, "")
                                                        .slice(0, 5),
                                                )
                                            }
                                            className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm uppercase"
                                        />
                                        <span className="mt-1 block text-[10px] text-slate-400">
                                            Generated from the initials of the space name. You can edit it.
                                        </span>
                                    </label>
                                </div>
                            </section>
                        )}
                        {createStep === 2 && (
                            <section className="rounded-xl border border-slate-200 bg-white p-6">
                                <h2 className="font-display text-lg font-bold">Configurations</h2>
                                <p className="mt-1 text-xs text-slate-500">Review and extend the template before creating the space.</p>
                                <div className="mt-5 space-y-4">
                                    {[
                                        ["Work types", workTypes, setWorkTypes],
                                        ["Statuses", statuses, setStatuses],
                                        ["Views", views, setViews],
                                    ].map(([label, values, setter]) => (
                                        <div key={label as string} className="rounded-lg border border-slate-200 p-4">
                                            <p className="text-xs font-bold">{label as string}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {(values as string[]).map((value) => (
                                                    <span
                                                        key={value}
                                                        className="flex items-center gap-1 rounded-md bg-brand-muted px-2 py-1 text-[10px] font-semibold text-brand"
                                                    >
                                                        {value}
                                                        <button
                                                            onClick={() =>
                                                                (setter as Dispatch<SetStateAction<string[]>>)((current) =>
                                                                    current.filter((item) => item !== value),
                                                                )
                                                            }
                                                            aria-label={`Remove ${value}`}
                                                        >
                                                            <Icon name="close" className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-3 flex gap-2">
                                                <input
                                                    value={newConfig[String(label)] ?? ""}
                                                    onChange={(event) =>
                                                        setNewConfig((current) => ({ ...current, [String(label)]: event.target.value }))
                                                    }
                                                    placeholder={`Add ${String(label).toLowerCase()}`}
                                                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                                />
                                                <Button
                                                    onClick={() => {
                                                        const value = newConfig[String(label)]?.trim();
                                                        if (value) {
                                                            (setter as Dispatch<SetStateAction<string[]>>)((current) => [...current, value]);
                                                            setNewConfig((current) => ({ ...current, [String(label)]: "" }));
                                                        }
                                                    }}
                                                >
                                                    <Icon name="plus" />
                                                    Add
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        {createStep === 3 && (
                            <section className="rounded-xl border border-slate-200 bg-white p-6">
                                <h2 className="font-display text-lg font-bold">Invite members</h2>
                                <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-muted text-brand">
                                        <Icon name="plus" />
                                    </span>
                                    <p className="mt-4 text-sm font-semibold">Member invitations are coming next</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        You can create the space now and invite collaborators later.
                                    </p>
                                </div>
                            </section>
                        )}
                        <div className="mt-5 flex justify-between">
                            <Button onClick={() => (createStep === 1 ? setPhase("detail") : setCreateStep((step) => step - 1))}>
                                Back
                            </Button>
                            <Button
                                variant="primary"
                                disabled={createStep === 1 && (!spaceName.trim() || !key)}
                                onClick={() => (createStep < 3 ? setCreateStep((step) => step + 1) : finish())}
                            >
                                {createStep === 3 ? "Create space and open board" : "Next"}
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );

    // if (phase === "detail") return <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50">
    //     <PageHeader
    //         eyebrow={`Spaces / Templates / ${selected.type}`}
    //         title={selected.name}
    //         description={selected.description}
    //         actions={
    //             <>
    //                 <Button onClick={() => setPhase("catalog")}>Back to templates</Button>
    //                 <Button variant="primary" onClick={() => { setCreateStep(1); setPhase("create"); }}>Use template</Button>
    //             </>
    //         }
    //     />
    //     <main className="flex-1 overflow-y-auto p-6">
    //         <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
    //             <TemplatePreview template={selected} />
    //             <aside className="space-y-5">
    //                 {[
    //                     ["Features", selected.features],
    //                     ["Workflows", selected.workflows],
    //                     ["Work types", selected.workTypes],
    //                     ["Views", selected.views]].map(([title, items]) => <section key={title as string} className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="text-xs font-bold">{title as string}</h2><div className="mt-3 space-y-2">{(items as string[]).map((item) => <div key={item} className="flex items-start gap-2 text-xs text-slate-600"><span className="mt-0.5 text-brand"><Icon name="check" className="h-3.5 w-3.5" /></span>{item}</div>)}</div></section>)}</aside></div></main>
    // </div>;

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50">
            <PageHeader
                eyebrow="Flow"
                title="Spaces"
                description="Choose a template to create a long-lived place where a team manages its work."
            />
            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl">
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Default templates</h2>
                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                            {DEFAULT_TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => selectTemplate(template)}
                                    className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-brand/30 hover:shadow-md"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-brand">
                                            <Icon name={template.id === "scrum" ? "calendar" : "check"} />
                                        </span>
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase text-slate-500">
                                            Default
                                        </span>
                                    </div>
                                    <h3 className="mt-4 font-display text-base font-bold">{template.name}</h3>
                                    <p className="mt-2 text-xs leading-5 text-slate-500">{template.description}</p>
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {template.views.map((view) => (
                                            <span key={view} className="rounded bg-slate-100 px-2 py-1 text-[9px] text-slate-500">
                                                {view}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                    {/* <section className="mt-8"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Custom templates</h2>{customTemplates.length ? <div className="mt-3 grid gap-4 md:grid-cols-2">{customTemplates.map((template) => <button key={template.id} onClick={() => selectTemplate(template)} className="rounded-xl border border-slate-200 bg-white p-5 text-left"><span className="text-[9px] font-bold uppercase text-brand">Custom</span><h3 className="mt-2 font-display text-base font-bold">{template.name}</h3><p className="mt-2 text-xs text-slate-500">{template.description}</p></button>)}</div> : <button onClick={() => setCustomOpen(true)} className="mt-3 flex w-full flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center hover:border-brand/40"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand"><Icon name="plus" /></span><span className="mt-3 text-sm font-semibold">Create your first custom template</span><span className="mt-1 text-xs text-slate-500">Define your own workflow, work types, and views.</span></button>}</section> */}
                    {/* <section className="mt-8"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Existing spaces</h2><div className="mt-3 grid gap-3 md:grid-cols-3">{workspaces.map((space) => <div key={space.id} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm font-bold">{space.name}</p><p className="mt-1 text-[10px] text-slate-400">{space.template} · {space.members} members</p></div>)}</div></section> */}
                </div>
            </main>
            {customOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
                    <section className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
                        <header className="flex items-center justify-between border-b border-slate-200 p-5">
                            <div>
                                <h2 className="font-display text-lg font-bold">Create custom template</h2>
                                <p className="mt-1 text-xs text-slate-500">Define reusable defaults for future spaces.</p>
                            </div>
                            <button onClick={() => setCustomOpen(false)}>
                                <Icon name="close" />
                            </button>
                        </header>
                        <div className="space-y-4 p-5">
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold">Template name</span>
                                <input
                                    autoFocus
                                    value={customName}
                                    onChange={(event) => setCustomName(event.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold">Description</span>
                                <textarea
                                    value={customDescription}
                                    onChange={(event) => setCustomDescription(event.target.value)}
                                    rows={3}
                                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold">Statuses</span>
                                <input
                                    value={customStatuses}
                                    onChange={(event) => setCustomStatuses(event.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-semibold">Work types</span>
                                <input
                                    value={customTypes}
                                    onChange={(event) => setCustomTypes(event.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <div>
                                <p className="mb-2 text-xs font-semibold">Views</p>
                                <div className="flex flex-wrap gap-2">
                                    {["Board", "List", "Backlog", "Timeline", "Calendar"].map((view) => (
                                        <label
                                            key={view}
                                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={customViews.includes(view)}
                                                onChange={() =>
                                                    setCustomViews((current) =>
                                                        current.includes(view) ? current.filter((item) => item !== view) : [...current, view],
                                                    )
                                                }
                                                className="accent-brand"
                                            />
                                            {view}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <footer className="flex justify-end gap-2 border-t border-slate-200 p-4">
                            <Button onClick={() => setCustomOpen(false)}>Cancel</Button>
                            <Button variant="primary" disabled={!customName.trim() || !customViews.length} onClick={saveCustom}>
                                Save and preview
                            </Button>
                        </footer>
                    </section>
                </div>
            )}
        </div>
    );
}
