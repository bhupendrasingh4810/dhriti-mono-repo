import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { PermissionCatalogDrawer } from "../../../apps/web/src/features/control/role-management/permission-catalog-drawer";
import { PermissionEditor } from "../../../apps/web/src/features/control/role-management/permission-editor";
import { RoleAssignment } from "../../../apps/web/src/features/control/role-management/role-assignment";
import { RoleCreationForm } from "../../../apps/web/src/features/control/role-management/role-creation-form";
import { RoleList } from "../../../apps/web/src/features/control/role-management/role-list";
import { usePermissionDraft } from "../../../apps/web/src/features/control/role-management/use-permission-draft";
import { RoleManagementSkeleton } from "../../../apps/web/src/features/control/role-management/role-management-skeleton";
import { NavigationSkeleton } from "../../../apps/web/src/components/layout/workspace/navigation-skeleton";
import type { Permission, Role } from "../../../apps/web/src/features/control/role-management/types";

const permissions: Permission[] = [
  { id: "read", key: "hrms.employee.read", productKey: "hrms", resource: "hrms.employee", action: "read" },
  { id: "manage", key: "hrms.employee.manage", productKey: "hrms", resource: "hrms.employee", action: "manage" },
  { id: "channel", key: "connect.channel.read", productKey: "connect", resource: "connect.channel", action: "read" },
];
const users = [
  { id: "jane", name: "Jane Doe", email: "jane@example.test" },
  { id: "john", name: "John Smith", email: "john@example.test" },
];
const initialRole: Role = {
  id: "members",
  name: "Members",
  description: "Everyday access to HRMS employee records and Connect channels.",
  permissions: [{ permission: permissions[0] }],
  assignments: [{ user: users[0] }],
  _count: { assignments: 1 },
};

/** Feature presentation components use mock callbacks here; stories never call the API. */
function RoleManagementPreview({ empty = false, longText = false }: { empty?: boolean; longText?: boolean }) {
  const [role, setRole] = useState<Role>({
    ...initialRole,
    ...(longText
      ? {
          name: "Organization-wide HRMS and Connect employee experience administrators",
          description:
            "Manage employee records, organization communications, and permission assignments across distributed teams.",
        }
      : {}),
    ...(empty ? { permissions: [], assignments: [], _count: { assignments: 0 } } : {}),
  });
  const toggle = async (batch: Permission[], attached: boolean) => {
    const ids = new Set(batch.map((permission) => permission.id));
    setRole((current) => ({
      ...current,
      permissions: attached
        ? current.permissions.filter(({ permission }) => !ids.has(permission.id))
        : [
            ...current.permissions,
            ...batch
              .filter((permission) => !current.permissions.some((entry) => entry.permission.id === permission.id))
              .map((permission) => ({ permission })),
          ],
    }));
  };
  return (
    <div className="grid h-screen min-h-0 gap-4 bg-background p-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <RoleList roles={empty ? [] : [role]} selectedId={role.id} onSelect={() => {}} noun="Permission group" />
      <div className="grid min-h-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <PermissionEditor
          role={role}
          permissions={empty ? [] : permissions}
          allowPermissionId={false}
          onToggle={(permission, attached) => toggle([permission], attached)}
          onToggleMany={toggle}
        />
        <RoleAssignment
          role={role}
          users={users}
          onAssign={async (userId) => {
            const user = users.find((candidate) => candidate.id === userId);
            if (!user) throw new Error("Unknown story member");
            setRole((current) => ({
              ...current,
              assignments: [...(current.assignments ?? []), { user }],
              _count: { assignments: current._count.assignments + 1 },
            }));
          }}
          onRevoke={async (userId) =>
            setRole((current) => ({
              ...current,
              assignments: current.assignments?.filter(({ user }) => user.id !== userId),
              _count: { assignments: current._count.assignments - 1 },
            }))
          }
        />
      </div>
    </div>
  );
}

const meta = {
  title: "Control/Role Management",
  component: RoleManagementPreview,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RoleManagementPreview>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const permission = canvas.getByRole("checkbox", { name: "Add hrms.employee.manage" });
    await userEvent.hover(permission);
    await userEvent.click(permission);
    await expect(canvas.getByRole("checkbox", { name: "Remove hrms.employee.manage" })).toBeChecked();
  },
};
export const Empty: Story = { args: { empty: true } };
export const PageSkeleton: Story = {
  render: () => (
    <div className="flex h-screen bg-background">
      <aside className="flex w-20 shrink-0 justify-center border-r border-border bg-surface py-3">
        <NavigationSkeleton />
      </aside>
      <main className="min-w-0 flex-1 p-4">
        <RoleManagementSkeleton />
      </main>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status", { name: "Loading apps" })).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByRole("status", { name: "Loading roles and permissions" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};
export const ResponsiveSkeleton: Story = {
  ...PageSkeleton,
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const DarkSkeleton: Story = { ...PageSkeleton, globals: { theme: "dark" } };
export const LongText: Story = { args: { longText: true } };
export const Responsive: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
export const Dark: Story = { globals: { theme: "dark" } };
export const CreateRole: Story = {
  render: () => (
    <RoleCreationForm noun="Platform role" includeKey isOpen onClose={() => {}} onCreate={async () => true} />
  ),
};
export const ValidationErrors: Story = {
  ...CreateRole,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Create Platform role" }));
    await expect(canvas.getByText("Name is required.")).toBeVisible();
    await expect(canvas.getByText("Key is required.")).toBeVisible();
  },
};
export const Loading: Story = {
  render: () => (
    <RoleCreationForm
      noun="Permission group"
      includeKey={false}
      isOpen
      onClose={() => {}}
      onCreate={() => new Promise<boolean>(() => {})}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", { name: /Name/ }), "HRMS reviewers");
    await userEvent.click(canvas.getByRole("button", { name: "Create Permission group" }));
    await expect(canvas.getByRole("button", { name: "Creating…" })).toBeDisabled();
  },
};
export const PermissionCatalog: Story = {
  render: () => (
    <PermissionCatalogDrawer
      isOpen
      permissions={permissions}
      onClose={() => {}}
      onCreate={async () => {}}
      onUpdate={async () => {}}
      onDelete={async () => {}}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Permission catalog (3)" })).toBeVisible();
    await userEvent.type(canvas.getByRole("textbox", { name: "Search permissions" }), "manage");
    await expect(canvas.getByRole("heading", { name: "Permission catalog (3)" })).toBeVisible();
  },
};

function ManualPermissionPreview() {
  const [role, setRole] = useState(initialRole);
  const [savedBatches, setSavedBatches] = useState(0);
  const [error, setError] = useState("");
  const draft = usePermissionDraft(
    [role],
    async (_role, changes) => {
      setRole((current) => {
        const selected = new Map(current.permissions.map(({ permission }) => [permission.id, permission]));
        for (const change of changes) {
          if (change.selected) selected.set(change.permission.id, change.permission);
          else selected.delete(change.permission.id);
        }
        return { ...current, permissions: [...selected.values()].map((permission) => ({ permission })) };
      });
      setSavedBatches((count) => count + 1);
    },
    (reason) => setError(reason instanceof Error ? reason.message : "Unable to save permissions"),
  );
  return (
    <div className="flex h-screen flex-col gap-4 bg-background p-4">
      <p role="status" className="text-sm text-text-secondary">
        {`Saved batches: ${savedBatches}`}
      </p>
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      <PermissionEditor
        role={draft.roles[0]}
        permissions={permissions}
        allowPermissionId={false}
        onSave={() => draft.saveRole(role)}
        hasChanges={draft.hasChanges(role)}
        isSaving={draft.saving}
        onToggle={async (permission, attached) => draft.queue(role, [permission], !attached)}
        onToggleMany={async (batch, attached) => draft.queue(role, batch, !attached)}
      />
    </div>
  );
}

export const SavePermissionChanges: Story = {
  render: () => <ManualPermissionPreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("checkbox", { name: "Add hrms.employee.manage" }));
    await expect(canvas.getByRole("checkbox", { name: "Remove hrms.employee.manage" })).toBeChecked();
    await expect(canvas.getByRole("status")).toHaveTextContent("Saved batches: 0");
    await userEvent.click(canvas.getByRole("button", { name: "Save permissions" }));
    await expect(canvas.findByText("Saved batches: 1")).resolves.toBeVisible();
  },
};

export const SavingPermissions: Story = {
  render: () => (
    <div className="h-screen bg-background p-4">
      <PermissionEditor
        role={initialRole}
        permissions={permissions}
        allowPermissionId={false}
        onToggle={async () => {}}
        onToggleMany={async () => {}}
        onSave={async () => {}}
        hasChanges
        isSaving
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Save permissions" })).toBeDisabled();
    await expect(canvas.getByRole("checkbox", { name: "Remove hrms.employee.read" })).toBeEnabled();
    await expect(canvas.getByRole("checkbox", { name: "Add hrms.employee.manage" })).toBeEnabled();
  },
};
