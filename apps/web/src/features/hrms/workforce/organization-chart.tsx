"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

import { OrganizationChartSkeleton } from "./skeletons";
import { useAuth } from "@/hooks/use-auth";
import { hrmsService, type HrmsOrgChartNode } from "@/services/hrms.service";
import { Avatar, Button, Card, Icon } from "../components/ui-primitives";
import { initialsOf } from "./shared";

const MIN_SCALE = 0.3;
const MAX_SCALE = 2;
const DRAG_THRESHOLD_PX = 4;

type TreeNode = HrmsOrgChartNode & { children: TreeNode[] };

/** Roots are employees without a manager (or whose manager is outside the list), so nobody is hidden. */
function buildTree(items: HrmsOrgChartNode[]): TreeNode[] {
  const nodes = new Map(items.map((item) => [item.id, { ...item, children: [] as TreeNode[] }]));
  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.reportingManagerId ? nodes.get(node.reportingManagerId) : undefined;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

function ChartNode({
  node,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
}) {
  const selected = selectedId === node.id;
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        data-chart-node
        aria-pressed={selected}
        onClick={() => onSelect(node)}
        className={`flex w-52 cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 text-left shadow-sm transition ${selected ? "border-brand ring-2 ring-brand/20" : "border-border hover:border-brand"}`}
      >
        <Avatar initials={initialsOf(node.user.name)} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-text-primary">{node.user.name}</span>
          <span className="block truncate text-xs text-text-muted">{node.designation?.name ?? node.department?.name ?? node.employeeNumber}</span>
        </span>
      </button>
      {node.children.length > 0 && (
        <>
          <div className="h-6 w-px bg-border-strong" aria-hidden="true" />
          <div className="flex">
            {node.children.map((child, index) => {
              const only = node.children.length === 1;
              return (
                <div key={child.id} className="relative flex flex-col items-center px-3 pt-6">
                  {!only && (
                    <div
                      aria-hidden="true"
                      className={`absolute top-0 h-px bg-border-strong ${index === 0 ? "left-1/2 right-0" : index === node.children.length - 1 ? "left-0 right-1/2" : "left-0 right-0"}`}
                    />
                  )}
                  <div aria-hidden="true" className="absolute left-1/2 top-0 h-6 w-px bg-border-strong" />
                  <ChartNode node={child} selectedId={selectedId} onSelect={onSelect} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Pannable, zoomable reporting hierarchy. Dragging the canvas pans it, the wheel and +/- buttons zoom,
 * and clicking a person selects them (movement beyond a few pixels counts as a drag, not a click).
 */
export function OrganizationChart({ onToast, onOpenProfile }: { onToast: (message: string) => void; onOpenProfile: (id: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [items, setItems] = useState<HrmsOrgChartNode[] | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [panning, setPanning] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    if (!organizationId) return;
    hrmsService.employees
      .orgChart(organizationId)
      .then((result) => setItems(result.items))
      .catch((reason) => {
        setItems([]);
        onToast(reason instanceof Error ? reason.message : "Unable to load the organization chart.");
      });
  }, [onToast, organizationId]);

  const roots = useMemo(() => buildTree(items ?? []), [items]);
  const zoom = (delta: number) =>
    setView((current) => ({ ...current, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(current.scale + delta).toFixed(2))) }));

  // React's onWheel is passive, so the listener is attached natively to be able to stop page scrolling.
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoom(event.deltaY < 0 ? 0.1 : -0.1);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [items]);

  const onPointerDown = (event: PointerEvent) => {
    drag.current = { x: event.clientX, y: event.clientY, moved: false };
  };
  const onPointerMove = (event: PointerEvent) => {
    const current = drag.current;
    if (!current) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    if (!current.moved) {
      current.moved = true;
      setPanning(true);
      viewport.current?.setPointerCapture(event.pointerId);
    }
    drag.current = { x: event.clientX, y: event.clientY, moved: true };
    setView((state) => ({ ...state, x: state.x + dx, y: state.y + dy }));
  };
  const endDrag = (event: PointerEvent) => {
    suppressClick.current = !!drag.current?.moved;
    drag.current = null;
    setPanning(false);
    if (viewport.current?.hasPointerCapture(event.pointerId)) viewport.current.releasePointerCapture(event.pointerId);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div>
          <h3 className="font-display text-base font-semibold text-text-primary">Organization chart</h3>
          <p className="text-xs text-text-muted">Drag to move, scroll or use the controls to zoom, select a person for details.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Zoom out" onClick={() => zoom(-0.1)} className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm font-semibold hover:bg-surface-raised">
            −
          </button>
          <span className="w-12 text-center text-xs font-semibold text-text-secondary">{Math.round(view.scale * 100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => zoom(0.1)} className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm font-semibold hover:bg-surface-raised">
            +
          </button>
          <Button variant="secondary" onClick={() => setView({ x: 0, y: 0, scale: 1 })}>
            Reset view
          </Button>
        </div>
      </div>
      {selected && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-brand-muted px-5 py-2.5 text-sm">
          <span className="font-semibold text-brand">{selected.user.name}</span>
          <span className="text-text-secondary">
            {[selected.designation?.name, selected.department?.name, selected.employeeNumber].filter(Boolean).join(" · ")}
          </span>
          <span className="text-text-muted">{selected.children.length} direct report{selected.children.length === 1 ? "" : "s"}</span>
          <button type="button" onClick={() => onOpenProfile(selected.id)} className="ml-auto cursor-pointer font-semibold text-brand hover:underline">
            View profile
          </button>
          <button type="button" aria-label="Clear selection" onClick={() => setSelected(null)} className="cursor-pointer">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <div
        ref={viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
        className={`relative h-[640px] touch-none select-none overflow-hidden bg-surface-raised ${panning ? "cursor-grabbing" : "cursor-grab"}`}
      >
        {items === null ? (
          <OrganizationChartSkeleton />
        ) : roots.length === 0 ? (
          <p className="p-10 text-center text-sm text-text-muted">Add employees to see the reporting hierarchy.</p>
        ) : (
          <div
            className="absolute left-1/2 top-6 flex gap-8"
            style={{ transform: `translate(calc(-50% + ${view.x}px), ${view.y}px) scale(${view.scale})`, transformOrigin: "top center" }}
          >
            {roots.map((root) => (
              <ChartNode key={root.id} node={root} selectedId={selected?.id ?? null} onSelect={setSelected} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
