"use client";

import { type FormEvent, useEffect, useEffectEvent, useState } from "react";

import type {
  ControlEntitlementDefinition,
  ControlEntitlementInput,
  EntitlementSortField,
} from "@/services/control.service";
import { controlPlatformService } from "@/services/control.service";

import { DeleteEntitlementDialog } from "@/features/control/entitlement/delete-entitlement-dialog";
import { EntitlementDrawer } from "@/features/control/entitlement/entitlement-drawer";
import {
  blankEntitlementDraft,
  toEntitlementDraft,
  validateEntitlementDraft,
  type EntitlementDraft,
  type EntitlementFieldErrors,
} from "@/features/control/entitlement/entitlement-form.types";
import { EntitlementTable } from "@/features/control/entitlement/entitlement-table";

type DrawerState =
  | { mode: null; selected: null; draft: null }
  | { mode: "create"; selected: null; draft: EntitlementDraft }
  | { mode: "view"; selected: ControlEntitlementDefinition; draft: null }
  | { mode: "edit"; selected: ControlEntitlementDefinition; draft: EntitlementDraft };

export default function EntitlementsCatalog() {
  const [items, setItems] = useState<ControlEntitlementDefinition[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<EntitlementSortField>("key");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reloadToken, setReloadToken] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [drawer, setDrawer] = useState<DrawerState>({ mode: null, selected: null, draft: null });
  const [fieldErrors, setFieldErrors] = useState<EntitlementFieldErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<ControlEntitlementDefinition | null>(null);
  const [error, setError] = useState("");

  const load = useEffectEvent(async () => {
    try {
      const result = await controlPlatformService.listEntitlements({
        search: search.trim() || undefined,
        sortBy,
        sortOrder,
        page,
        limit: pageSize,
      });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load entitlements");
    }
  });

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [search, sortBy, sortOrder, page, pageSize, reloadToken]);

  const sort = (field: EntitlementSortField) => {
    if (field === sortBy) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const closeDrawer = () => {
    setDrawer({ mode: null, selected: null, draft: null });
    setFieldErrors({});
  };

  const openCreate = () => {
    setDrawer({ mode: "create", selected: null, draft: blankEntitlementDraft() });
    setFieldErrors({});
  };

  const openView = (item: ControlEntitlementDefinition) => {
    setDrawer({ mode: "view", selected: item, draft: null });
    setFieldErrors({});
  };

  const openEdit = (item: ControlEntitlementDefinition) => {
    setDrawer({ mode: "edit", selected: item, draft: toEntitlementDraft(item) });
    setFieldErrors({});
  };

  const save = async (event: FormEvent<HTMLFormElement>, submittedDraft: EntitlementDraft) => {
    event.preventDefault();

    const validationErrors = validateEntitlementDraft(submittedDraft, Boolean(drawer.selected));
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const input: ControlEntitlementInput = {
      name: submittedDraft.name.trim(),
      kind: submittedDraft.kind,
      productKey: submittedDraft.productKey.trim() || undefined,
      description: submittedDraft.description.trim() || undefined,
      unit: submittedDraft.unit.trim() || undefined,
    };

    try {
      const result = drawer.selected
        ? await controlPlatformService.updateEntitlement(drawer.selected.id, input)
        : await controlPlatformService.createEntitlement({
            ...input,
            key: submittedDraft.key.trim(),
          } as ControlEntitlementInput & {
            key: string;
            name: string;
            kind: "FEATURE" | "LIMIT";
          });
      if (!drawer.selected) setPage(1);
      setReloadToken((current) => current + 1);
      closeDrawer();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save entitlement");
    }
  };

  const remove = async (item: ControlEntitlementDefinition) => {
    try {
      await controlPlatformService.deleteEntitlement(item.id);
      closeDrawer();
      setDeleteTarget(null);
      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        setReloadToken((current) => current + 1);
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete entitlement");
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-950">Entitlements</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Reusable access definitions shared across plans and organization overrides.
          </p>
        </div>
        <button
          type="button"
          aria-label="Create entitlement"
          className="cursor-pointer rounded-lg bg-brand p-2 text-white"
          title="Create entitlement"
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#036c5f",
            color: "white",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
          onClick={openCreate}
        >
          Create Entitlement
        </button>
      </div>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}
      <div className="mb-4">
        <input
          aria-label="Search entitlements"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"
          placeholder="Search entitlements"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>
      <EntitlementTable
        items={items}
        pagination={pagination}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onView={openView}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onPageChange={setPage}
        onSort={sort}
        onPageSizeChange={(limit) => {
          setPageSize(limit);
          setPage(1);
        }}
      />
      <EntitlementDrawer
        key={`${drawer.mode}:${drawer.selected?.id ?? ""}`}
        mode={drawer.mode}
        selected={drawer.selected}
        draft={drawer.draft}
        fieldErrors={fieldErrors}
        onClose={closeDrawer}
        onDraftChange={(nextDraft, field) => {
          setDrawer((current) => (current.draft ? { ...current, draft: nextDraft } : current));
          if (field) setFieldErrors((current) => ({ ...current, [field]: undefined }));
        }}
        onSubmit={(event, submittedDraft) => void save(event, submittedDraft)}
      />
      <DeleteEntitlementDialog
        item={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={(item) => void remove(item)}
      />
    </div>
  );
}
