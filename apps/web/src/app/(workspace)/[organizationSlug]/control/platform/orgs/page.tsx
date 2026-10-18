"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";
import {
  AddOrganizationDrawer,
  type AddOrganizationErrors,
  type AddOrganizationForm,
  type OrganizationPlan,
} from "@/features/control/orgs/add-organization-drawer";
import {
  OrganizationDetailModal,
  type OrganizationDetailTab,
} from "@/features/control/orgs/organization-detail-modal";
import { DeleteOrganizationDialog } from "@/features/control/orgs/delete-organization-dialog";
import { OrganizationFilters } from "@/features/control/orgs/organization-filters";
import { OrganizationPageHeader } from "@/features/control/orgs/organization-page-header";
import { OrganizationSuspensionDialog } from "@/features/control/orgs/organization-suspension-dialog";
import { OrganizationTable } from "@/features/control/orgs/organization-table";
import {
  controlPlatformService,
  type PlatformOrganization,
  type PlatformOrganizationSortField,
} from "@/services/control.service";

type Plan = OrganizationPlan;
type Status = "Active" | "Trial" | "Suspended" | "Churned";

interface Org {
  id: string;
  name: string;
  plan: Plan;
  seats: string;
  status: Status;
  created: string;
  mrr: string;
}

const planByApiValue: Record<string, Plan> = {
  FREE: "Free",
  STANDARD: "Standard",
  PREMIUM: "Premium",
  ENTERPRISE: "Enterprise",
};

const statusByApiValue: Record<Status, "ACTIVE" | "TRIALING" | "SUSPENDED" | "CANCELLED"> = {
  Active: "ACTIVE",
  Trial: "TRIALING",
  Suspended: "SUSPENDED",
  Churned: "CANCELLED",
};

function toOrg(organization: PlatformOrganization): Org {
  const subscription = organization.subscription;
  const status: Status =
    subscription?.status === "SUSPENDED"
      ? "Suspended"
      : subscription?.status === "TRIALING"
        ? "Trial"
        : subscription?.status === "CANCELLED"
          ? "Churned"
          : "Active";

  return {
    id: organization.id,
    name: organization.name,
    plan: planByApiValue[subscription?.plan ?? "FREE"] ?? "Free",
    seats: `${organization?.seats ?? 0}`,
    status,
    created: new Date(organization.createdAt ?? "").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    mrr: "--",
  };
}

type ModalType = "none" | "add" | "suspend" | "delete" | "detail";

export default function OrgsPanel() {
  const { toasts, addToast, removeToast } = useToast();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<Plan | "All">("All");
  const [filterStatus, setFilterStatus] = useState<Status | "All">("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<PlatformOrganizationSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [reloadToken, setReloadToken] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>("none");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [detailTab, setDetailTab] = useState<OrganizationDetailTab>("overview");
  const [addForm, setAddForm] = useState<AddOrganizationForm>({ name: "", plan: "Free", seats: "", email: "" });
  const [addErrors, setAddErrors] = useState<AddOrganizationErrors>({});

  const loadOrganizations = useEffectEvent(async () => {
    setIsLoading(true);
    try {
      const result = await controlPlatformService.listOrganizations({
        search: search.trim() || undefined,
        plan: filterPlan === "All" ? undefined : filterPlan.toUpperCase() as "FREE" | "STANDARD" | "PREMIUM" | "ENTERPRISE",
        status: filterStatus === "All" ? undefined : statusByApiValue[filterStatus],
        sortBy,
        sortOrder,
        page,
        limit: pageSize,
      });
      console.log("Loaded organizations:", result.items);
      setOrgs(result.items.map(toOrg));
      setPagination(result.pagination);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to load organizations", "error");
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void Promise.resolve().then(loadOrganizations);
  }, [search, filterPlan, filterStatus, sortBy, sortOrder, page, pageSize, reloadToken]);

  const sort = (field: PlatformOrganizationSortField) => {
    if (field === sortBy) {
      setSortOrder((current) => current === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === orgs.length) setSelected(new Set());
    else setSelected(new Set(orgs.map((organization) => organization.id)));
  };

  const validateAdd = (): boolean => {
    const errs: AddOrganizationErrors = {};
    if (!addForm.name.trim()) errs.name = "Organization name is required";
    if (!addForm.email.trim()) errs.email = "Admin email is required";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(addForm.email)) errs.email = "Invalid email address";
    if (!addForm.seats.trim()) errs.seats = "Seat count is required";
    else if (isNaN(Number(addForm.seats)) || Number(addForm.seats) < 1) errs.seats = "Must be a positive number";
    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddOrg = async () => {
    if (!validateAdd()) return;
    setIsSaving(true);
    try {
      const created = await controlPlatformService.createOrganization({
        name: addForm.name,
        adminEmail: addForm.email,
        plan: addForm.plan.toUpperCase() as "FREE" | "STANDARD" | "PREMIUM" | "ENTERPRISE",
        seats: Number(addForm.seats),
      });
      const newOrg = toOrg(created);
      setPage(1);
      setReloadToken((current) => current + 1);
      setModal("none");
      setAddForm({ name: "", plan: "Free", seats: "", email: "" });
      setAddErrors({});
      addToast(`Organization "${newOrg.name}" created`, "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to create organization", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuspend = async () => {
    const org = orgs.find((organization) => organization.id === targetId);
    if (!org) return;
    const newStatus: Status = org.status === "Suspended" ? "Active" : "Suspended";
    setIsSaving(true);
    try {
      await controlPlatformService.setOrganizationSuspended(org.id, newStatus === "Suspended");
      setReloadToken((current) => current + 1);
      setModal("none");
      setSuspendReason("");
      addToast(
        `${org.name} ${newStatus === "Suspended" ? "suspended" : "reactivated"}`,
        newStatus === "Suspended" ? "warning" : "success",
      );
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to update organization", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const org = orgs.find((organization) => organization.id === targetId);
    if (!org || deleteConfirm !== "DELETE") return;
    setIsSaving(true);
    try {
      await controlPlatformService.deleteOrganization(org.id);
      if (orgs.length === 1 && page > 1) setPage((current) => current - 1);
      else setReloadToken((current) => current + 1);
      setSelected((previous) => {
        const next = new Set(previous);
        next.delete(org.id);
        return next;
      });
      setModal("none");
      setDeleteConfirm("");
      addToast(`Organization "${org.name}" deleted`, "error");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to delete organization", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const openSuspend = (id: string) => {
    setTargetId(id);
    setModal("suspend");
    setOpenMenu(null);
  };
  const openDelete = (id: string) => {
    setTargetId(id);
    setModal("delete");
    setOpenMenu(null);
  };
  const openDetail = (id: string) => {
    setTargetId(id);
    setModal("detail");
    setDetailTab("overview");
    setOpenMenu(null);
  };

  const closeModal = () => {
    setModal("none");
    setTargetId(null);
    setDeleteConfirm("");
    setSuspendReason("");
  };

  const targetOrg = orgs.find((organization) => organization.id === targetId) ?? null;

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <OrganizationPageHeader total={pagination.total} onAdd={() => setModal("add")} />

      <OrganizationFilters
        search={search}
        plan={filterPlan}
        status={filterStatus}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onPlanChange={(value) => {
          setFilterPlan(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setFilterStatus(value);
          setPage(1);
        }}
      />

      <OrganizationTable
        items={orgs}
        selected={selected}
        openMenu={openMenu}
        sortBy={sortBy}
        sortOrder={sortOrder}
        pagination={pagination}
        isLoading={isLoading}
        onToggleAll={toggleAll}
        onToggleSelect={toggleSelect}
        onToggleMenu={(id) => setOpenMenu(openMenu === id ? null : id)}
        onView={openDetail}
        onSuspend={openSuspend}
        onDelete={openDelete}
        onSort={sort}
        onPageChange={setPage}
        onPageSizeChange={(limit) => {
          setPageSize(limit);
          setPage(1);
        }}
      />

      {/* Click outside to close menu */}
      {openMenu !== null && (
        <div style={{ position: "fixed", inset: 0, zIndex: 5 }} onClick={() => setOpenMenu(null)} />
      )}

      {modal === "add" && (
        <AddOrganizationDrawer
          form={addForm}
          errors={addErrors}
          onFormChange={setAddForm}
          onClose={closeModal}
          onSubmit={handleAddOrg}
        />
      )}

      {modal === "suspend" && targetOrg && (
        <OrganizationSuspensionDialog
          organization={targetOrg}
          reason={suspendReason}
          onReasonChange={setSuspendReason}
          onClose={closeModal}
          onConfirm={handleSuspend}
        />
      )}

      {modal === "delete" && targetOrg && (
        <DeleteOrganizationDialog
          organization={targetOrg}
          confirmation={deleteConfirm}
          onConfirmationChange={setDeleteConfirm}
          onClose={closeModal}
          onConfirm={handleDelete}
        />
      )}

      {modal === "detail" && targetOrg && (
        <OrganizationDetailModal
          organization={targetOrg}
          activeTab={detailTab}
          onTabChange={setDetailTab}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
