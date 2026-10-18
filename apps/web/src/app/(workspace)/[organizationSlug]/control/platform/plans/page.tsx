"use client";

import { useEffect, useEffectEvent, useState } from "react";

import {
  controlPlatformService,
  type ControlEntitlementDefinition,
  type ControlPlan,
  type ControlPlanEntitlementInput,
} from "@/services/control.service";
import { CreatePlanDrawer } from "@/features/control/plan/create-plan-drawer";
import { DeletePlanDialog } from "@/features/control/plan/delete-plan-dialog";
import { PlanCard } from "@/features/control/plan/plan-card";
import { PlanDrawer, type PlanDrawerMode } from "@/features/control/plan/plan-drawer";

export default function PlansPage() {
  const [plans, setPlans] = useState<ControlPlan[]>([]);
  const [definitions, setDefinitions] = useState<ControlEntitlementDefinition[]>([]);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [assignments, setAssignments] = useState<ControlPlanEntitlementInput[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ControlPlan | null>(null);
  const [planDrawerMode, setPlanDrawerMode] = useState<PlanDrawerMode>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ControlPlan | null>(null);
  const [error, setError] = useState("");

  const load = useEffectEvent(async () => {
    try {
      const [planData, entitlementData] = await Promise.all([
        controlPlatformService.listPlans(),
        controlPlatformService.listEntitlements(),
      ]);
      setPlans(planData);
      setDefinitions(entitlementData.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load plans");
    }
  });

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const savePlan = async () => {
    try {
      const plan = await controlPlatformService.createPlan({
        key,
        name,
        description: description || undefined,
        entitlements: assignments,
      });
      setPlans((current) => [plan, ...current]);
      setName("");
      setKey("");
      setDescription("");
      setAssignments([]);
      setIsCreateOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create plan");
    }
  };

  const replaceAssignments = async (plan: ControlPlan) => {
    try {
      const updated = await controlPlatformService.replacePlanEntitlements(plan.id, assignments);
      setPlans((current) => current.map((item) => (item.id === plan.id ? updated : item)));
      setSelectedPlan(updated);
      setPlanDrawerMode("view");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update plan entitlements");
    }
  };

  const toggle = (definition: ControlEntitlementDefinition) => {
    setAssignments((current) => {
      const existing = current.find((item) => item.entitlementKey === definition.key);
      if (!existing)
        return [
          ...current,
          { entitlementKey: definition.key, enabled: true, value: definition.kind === "LIMIT" ? 0 : undefined },
        ];
      return current.map((item) =>
        item.entitlementKey === definition.key ? { ...item, enabled: !item.enabled } : item,
      );
    });
  };

  const openCreateForm = () => {
    setName("");
    setKey("");
    setDescription("");
    setAssignments([]);
    setIsCreateOpen(true);
  };

  const openPlanDrawer = (plan: ControlPlan, mode: "view" | "edit") => {
    setSelectedPlan(plan);
    setAssignments(
      plan.entitlements.map((item) => ({
        entitlementKey: item.entitlement.key,
        enabled: item.enabled,
        value: item.value ?? undefined,
      })),
    );
    setPlanDrawerMode(mode);
  };

  const closePlanDrawer = () => {
    setPlanDrawerMode(null);
    setSelectedPlan(null);
  };

  const updatePlanStatus = async (plan: ControlPlan, isActive: boolean) => {
    try {
      const updated = await controlPlatformService.updatePlanStatus(plan.id, isActive);
      setPlans((current) => current.map((item) => (item.id === plan.id ? updated : item)));
      setSelectedPlan((current) => (current?.id === plan.id ? updated : current));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to update plan status");
    }
  };

  const deletePlan = async (plan: ControlPlan) => {
    try {
      await controlPlatformService.deletePlan(plan.id);
      setPlans((current) => current.filter((item) => item.id !== plan.id));
      setDeleteTarget(null);
      if (selectedPlan?.id === plan.id) closePlanDrawer();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete plan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Plans</h1>
          <p className="mt-1 text-sm text-slate-500">
            Define the features and numeric limits available with each purchased plan.
          </p>
        </div>
        <button
          className="inline-flex rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white"
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
          onClick={openCreateForm}
        >
          Create plan
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <section aria-labelledby="published-plans-heading">
        <h2 id="published-plans-heading" className="text-lg font-semibold text-slate-950">Published plans</h2>
        {plans.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onOpen={(item) => openPlanDrawer(item, "view")}
                onEdit={(item) => openPlanDrawer(item, "edit")}
                onDelete={setDeleteTarget}
                onStatusChange={(item, isActive) => void updatePlanStatus(item, isActive)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No plans have been created yet.
          </div>
        )}
      </section>
      <PlanDrawer
        mode={planDrawerMode}
        plan={selectedPlan}
        definitions={definitions}
        assignments={assignments}
        onClose={closePlanDrawer}
        onEdit={() => setPlanDrawerMode("edit")}
        onSave={() => selectedPlan && void replaceAssignments(selectedPlan)}
        onToggle={toggle}
        onValueChange={(entitlementKey, value) =>
          setAssignments((current) =>
            current.map((item) => (item.entitlementKey === entitlementKey ? { ...item, value } : item)),
          )
        }
      />
      <DeletePlanDialog plan={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={(plan) => void deletePlan(plan)} />
      <CreatePlanDrawer
        isOpen={isCreateOpen}
        name={name}
        planKey={key}
        description={description}
        definitions={definitions}
        assignments={assignments}
        onClose={() => setIsCreateOpen(false)}
        onNameChange={setName}
        onKeyChange={setKey}
        onDescriptionChange={setDescription}
        onToggle={toggle}
        onValueChange={(entitlementKey, value) =>
          setAssignments((current) =>
            current.map((item) => (item.entitlementKey === entitlementKey ? { ...item, value } : item)),
          )
        }
        onCreate={() => void savePlan()}
      />
    </div>
  );
}
