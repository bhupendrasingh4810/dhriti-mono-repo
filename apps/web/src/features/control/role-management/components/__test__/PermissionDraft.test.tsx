import { act, cleanup, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PermissionChange, Role } from "../../types";
import { usePermissionDraft } from "../../use-permission-draft";

const read = { id: "read", key: "hrms.employee.read" };
const manage = { id: "manage", key: "hrms.employee.manage" };
const role: Role = {
  id: "members",
  name: "Members",
  description: null,
  permissions: [{ permission: read }],
  _count: { assignments: 0 },
};
const other: Role = { ...role, id: "admin", name: "Administrators" };
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function setup() {
  const write = vi.fn<(role: Role, changes: PermissionChange[]) => Promise<void>>().mockResolvedValue(undefined);
  const onError = vi.fn();
  const hook = renderHook(() => {
    const [roles, setRoles] = useState([role, other]);
    return usePermissionDraft(
      roles,
      async (savedRole, changes) => {
        await write(savedRole, changes);
        setRoles((current) =>
          current.map((entry) => {
            if (entry.id !== savedRole.id) return entry;
            const selected = new Map(entry.permissions.map(({ permission }) => [permission.id, permission]));
            for (const change of changes) {
              if (change.selected) selected.set(change.permission.id, change.permission);
              else selected.delete(change.permission.id);
            }
            return { ...entry, permissions: [...selected.values()].map((permission) => ({ permission })) };
          }),
        );
      },
      onError,
    );
  });
  return { ...hook, write, onError };
}
const ids = (entry: Role) => entry.permissions.map(({ permission }) => permission.id);

describe("explicit-save permission drafts", () => {
  it("updates immediately but never saves on a timer or unmount", async () => {
    vi.useFakeTimers();
    const { result, write, unmount } = setup();
    act(() => result.current.queue(role, [manage], true));
    expect(ids(result.current.roles[0])).toEqual(["read", "manage"]);
    expect(result.current.hasChanges(role)).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(write).not.toHaveBeenCalled();
    unmount();
    expect(write).not.toHaveBeenCalled();
  });

  it("saves only net additions and removals when explicitly requested", async () => {
    const { result, write } = setup();
    act(() => {
      result.current.queue(role, [manage], true);
      result.current.queue(role, [read], false);
    });
    expect(write).not.toHaveBeenCalled();
    await act(() => result.current.saveRole(role));
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith(role, [
      { permission: manage, selected: true },
      { permission: read, selected: false },
    ]);
    expect(ids(result.current.roles[0])).toEqual(["manage"]);
    expect(result.current.hasChanges(role)).toBe(false);
  });

  it("cancels reversed selections without writes", async () => {
    const { result, write } = setup();
    act(() => {
      result.current.queue(role, [manage], true);
      result.current.queue(role, [manage], false);
      result.current.queue(role, [read], false);
      result.current.queue(role, [read], true);
    });
    expect(result.current.hasChanges(role)).toBe(false);
    await act(() => result.current.saveRole(role));
    expect(write).not.toHaveBeenCalled();
  });

  it("keeps other roles' drafts when saving the selected role", async () => {
    const { result, write } = setup();
    act(() => {
      result.current.queue(role, [manage], true);
      result.current.queue(other, [read], false);
    });
    await act(() => result.current.saveRole(role));
    expect(write).toHaveBeenCalledTimes(1);
    expect(result.current.hasChanges(other)).toBe(true);
    expect(ids(result.current.roles[1])).toEqual([]);
    await act(() => result.current.saveRole(other));
    expect(write).toHaveBeenNthCalledWith(2, other, [{ permission: read, selected: false }]);
  });

  it("blocks duplicate submissions but retains newer edits for the next save", async () => {
    const { result, write } = setup();
    let finish!: () => void;
    write.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    act(() => result.current.queue(role, [manage], true));
    let operation!: Promise<void>;
    act(() => {
      operation = result.current.saveRole(role);
    });
    expect(result.current.saving).toBe(true);
    await act(async () => {
      await result.current.saveRole(role);
      result.current.queue(role, [manage], false);
    });
    expect(write).toHaveBeenCalledTimes(1);
    expect(ids(result.current.roles[0])).toEqual(["read"]);
    await act(async () => {
      finish();
      await operation;
    });
    expect(result.current.saving).toBe(false);
    expect(ids(result.current.roles[0])).toEqual(["read"]);
    expect(result.current.hasChanges(role)).toBe(true);
    await act(() => result.current.saveRole(role));
    expect(write).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: role.id }), [
      { permission: manage, selected: false },
    ]);
    expect(result.current.hasChanges(role)).toBe(false);
  });

  it("retains a failed draft and allows an explicit retry", async () => {
    const { result, write, onError } = setup();
    const error = new Error("Permission denied");
    write.mockRejectedValueOnce(error);
    act(() => result.current.queue(role, [manage], true));
    await act(() => result.current.saveRole(role));
    expect(onError).toHaveBeenCalledWith(error);
    expect(ids(result.current.roles[0])).toEqual(["read", "manage"]);
    expect(result.current.hasChanges(role)).toBe(true);
    expect(result.current.saving).toBe(false);
    await act(() => result.current.saveRole(role));
    expect(write).toHaveBeenCalledTimes(2);
    expect(result.current.hasChanges(role)).toBe(false);
  });
});
