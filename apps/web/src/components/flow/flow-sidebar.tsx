import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PROJECTS } from "@/components/flow/flow.data";

interface FlowSidebarProps {
    navView: string;
    onNav: (v: string) => void;
    selectedSpace: string | null;
    onSpace: (k: string) => void;
    collapsed: boolean;
    onCollapse: () => void;
}
export default function FlowSidebar({
    navView,
    onNav,
    selectedSpace,
    onSpace,
    collapsed,
    onCollapse,
}: FlowSidebarProps) {
    const params = useParams();
    const [menu, setMenu] = useState<"recent" | "starred" | null>(null);
    const [search, setSearch] = useState("");
    const [spacesExpanded, setSpacesExpanded] = useState(true);
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menu) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!sidebarRef.current?.contains(event.target as Node)) {
                setMenu(null);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [menu]);

    const starred = PROJECTS.filter((p) => ["PAY", "PLAT", "MOB", "WEB"].includes(p.key));
    const recentGroups = [
        { label: "Today", items: [PROJECTS[0], PROJECTS[2]] },
        { label: "Yesterday", items: [PROJECTS[1], PROJECTS[3]] },
        { label: "Older", items: [PROJECTS[4], PROJECTS[5]] },
    ];

    const getNavUrl = (space: { key: string }) => `/${params.organizationSlug}/flow/spaces/${space.key}/board`;

    const icon = (id: "dashboard" | "recent" | "starred" | "spaces" | "projects") => {
        if (id === "dashboard")
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                </svg>
            );
        if (id === "recent")
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                </svg>
            );
        if (id === "starred")
            return (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" />
                </svg>
            );
        if (id === "spaces")
            return (
                <svg
                    className={`transition-transform duration-200 ${spacesExpanded ? "rotate-90" : ""}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            );
        return (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 5h6l2 3h8v11H4z" />
            </svg>
        );
    };
    const row = (id: "dashboard" | "recent" | "starred" | "spaces", label: string, trailing?: React.ReactNode) => (
        <button
            key={id}
            onClick={() => {
                if (id === "recent" || id === "starred") setMenu(menu === id ? null : id);
                else if (id === "spaces") {
                    setMenu(null);
                    setSpacesExpanded((expanded) => !expanded);
                } else {
                    setMenu(null);
                    onNav(id);
                }
            }}
            aria-expanded={id === "spaces" ? spacesExpanded : undefined}
            className="w-full flex items-center gap-2.5 px-4 py-2 cursor-pointer transition-colors"
            style={{
                backgroundColor: navView === id && !selectedSpace ? "#e6f4f2" : "transparent",
                color: navView === id && !selectedSpace ? "#036c5f" : "#475569",
                fontWeight: navView === id && !selectedSpace ? 700 : 500,
                fontSize: "14px",
            }}
        >
            <span className="text-slate-400">{icon(id)}</span>
            <span>{label}</span>
            <span className="ml-auto text-slate-400">{trailing}</span>
        </button>
    );
    return (
        <div
            ref={sidebarRef}
            className="relative flex flex-col h-full bg-white border-r border-slate-100 select-none"
            style={{ overflow: "visible", transition: "width 0.2s" }}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-700" style={{ fontFamily: "var(--font-display)" }}>
                    Flow
                </span>
            </div>
            <div className="flex-1 overflow-y-auto py-2 overflow-x-visible">
                {row("dashboard", "Dashboard")}
                {row("recent", "Recent", "›")}
                {row("starred", "Starred", "›")}
                {row(
                    "spaces",
                    "Spaces",
                    <Link
                        role="button"
                        href={`/${params.organizationSlug}/flow/spaces/new`}
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.stopPropagation();
                                setMenu(null);
                                onNav("spaces");
                            }
                        }}
                        onClick={(event) => {
                            event.stopPropagation();
                            setMenu(null);
                            onNav("spaces");
                        }}
                        aria-label="Create space"
                        className="text-base leading-none hover:text-brand"
                    >
                        +
                    </Link>,
                )}
                <div
                    aria-hidden={!spacesExpanded}
                    className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${spacesExpanded ? "mb-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                    <div className="min-h-0 overflow-hidden">
                        <div className="ml-3 border-slate-200 pl-2">
                            {PROJECTS.map((space) => (
                                <Link
                                    key={space.key}
                                    href={getNavUrl(space)}
                                    onClick={() => {
                                        setMenu(null);
                                        onSpace(space.key);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors"
                                    style={{
                                        backgroundColor: selectedSpace === space.key ? "#e6f4f2" : "transparent",
                                        color: selectedSpace === space.key ? "#036c5f" : "#64748b",
                                        fontWeight: selectedSpace === space.key ? 700 : 500,
                                    }}
                                >
                                    <span
                                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[8px] font-black text-white"
                                        style={{ backgroundColor: space.color }}
                                    >
                                        {space.initials}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-[14px]">{space.name}</span>
                                    {space.starred && <span className="text-[10px] text-amber-400">★</span>}
                                </Link>
                            ))}
                            <Link
                                href={`/${params.organizationSlug}/flow/spaces`}
                                className="w-full px-2 py-1.5 text-left text-[10px] font-semibold text-brand"
                            >
                                View all spaces →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            {/* <button onClick={() => { setMenu(null); onNav("future-projects"); }} className="flex items-center gap-2.5 border-t border-slate-100 px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">{icon("projects")}Projects<span className="ml-auto text-[9px] font-medium text-slate-400">Later</span></button> */}
            <button
                onClick={onCollapse}
                className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
                <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                >
                    <polyline points="11 17 6 12 11 7" />
                    <polyline points="18 17 13 12 18 7" />
                </svg>
                Collapse
            </button>
            {menu && (
                <div className="absolute left-[calc(100%+1px)] pb-3 top-12 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <h3 className="text-sm font-bold text-slate-800">{menu === "recent" ? "Recent" : "Starred"}</h3>
                        <button onClick={() => setMenu(null)} className="text-slate-400">
                            ×
                        </button>
                    </div>
                    {menu === "recent" && (
                        <div className="border-b border-slate-100 p-3">
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="7" />
                                    <path d="m20 20-4-4" />
                                </svg>
                                <input
                                    autoFocus
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search recent items"
                                    className="w-full text-xs outline-none"
                                />
                            </div>
                        </div>
                    )}
                    <div className="max-h-[460px] overflow-y-auto p-2">
                        {(menu === "recent" ? recentGroups : [{ label: "Starred spaces", items: starred }]).map((group) => (
                            <div key={group.label}>
                                <p className="px-2 pb-1 pt-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                    {group.label}
                                </p>
                                {group.items
                                    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                                    .map((p) => (
                                        <button
                                            key={p.key}
                                            onClick={() => {
                                                setMenu(null);
                                                onSpace(p.key);
                                            }}
                                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                                        >
                                            <span
                                                className="flex h-7 w-7 items-center justify-center rounded-md text-[9px] font-bold text-white"
                                                style={{ backgroundColor: p.color }}
                                            >
                                                {p.initials}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-xs font-semibold text-slate-700">{p.name}</span>
                                                <span className="block text-[9px] text-slate-400">Space · {p.key}</span>
                                            </span>
                                            {menu === "starred" && <span className="text-amber-400">★</span>}
                                        </button>
                                    ))}
                            </div>
                        ))}
                    </div>
                    {menu === "recent" && (
                        <Link
                            href="#"
                            onClick={() => {
                                setMenu(null);
                                onNav("recent");
                            }}
                            className="w-full border-t border-slate-100 px-4 py-3 text-left text-xs font-semibold text-brand hover:bg-brand-muted"
                        >
                            View all recent items →
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
