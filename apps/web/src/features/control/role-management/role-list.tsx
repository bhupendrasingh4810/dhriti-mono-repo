"use client";

import { DhritiButton, DhritiTextField } from "@dhriti/ui";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Role } from "./types";

export function RoleList({
  roles,
  selectedId,
  onSelect,
  onEdit,
  noun,
}: {
  roles: Role[];
  selectedId: string;
  onSelect: (id: string) => void;
  onEdit?: (role: Role) => void;
  noun: string;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRoles = normalizedQuery
    ? roles.filter((role) => `${role.name} ${role.description ?? ""}`.toLowerCase().includes(normalizedQuery))
    : roles;

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-surface p-3">
      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{noun}s</p>
      <div className="mb-3 px-1">
        <DhritiTextField
          label={`Search ${noun.toLowerCase()}s`}
          showLabel={false}
          value={query}
          onChange={setQuery}
          placeholder={`Search ${noun.toLowerCase()}s`}
        />
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {filteredRoles.length ? (
          filteredRoles.map((role) => {
            const isSelected = role.id === selectedId;
            return (
              <div
                key={role.id}
                className={`flex items-center rounded-md transition-colors ${
                  isSelected ? "bg-brand-muted text-brand" : "text-text-primary hover:bg-surface-raised"
                }`}
              >
                <DhritiButton
                  variant="secondary"
                  type="button"
                  onClick={() => onSelect(role.id)}
                  className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal !gap-0 !block min-w-0 flex-1 cursor-pointer !px-3 !py-2 !text-left hover:!bg-transparent !text-inherit !rounded-none"
                >
                  <span className="block truncate text-sm font-semibold">{role.name}</span>
                  <span className="block text-xs text-text-muted">
                    {role._count.assignments} assignments · {role.permissions.length} permissions
                  </span>
                </DhritiButton>
                {onEdit ? (
                  <DhritiButton
                    variant="secondary"
                    type="button"
                    onClick={() => onEdit(role)}
                    className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal !gap-0 mr-2 cursor-pointer !rounded-md !p-2 !text-text-secondary hover:!bg-surface hover:!text-text-primary"
                    aria-label={`Edit ${role.name}`}
                    title={`Edit ${role.name}`}
                  >
                    <Pencil aria-hidden="true" size={16} />
                  </DhritiButton>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="px-3 py-4 text-sm text-text-muted">
            {normalizedQuery ? `No ${noun.toLowerCase()}s match your search.` : `No ${noun.toLowerCase()}s yet.`}
          </p>
        )}
      </div>
    </aside>
  );
}
