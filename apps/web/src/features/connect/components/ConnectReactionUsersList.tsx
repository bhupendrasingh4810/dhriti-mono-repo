"use client";

import type { ConnectReactionUser } from "@/types/connect.types";

type ConnectReactionUsersListProps = {
  emoji: string;
  users: ConnectReactionUser[];
};

export function ConnectReactionUsersList({ emoji, users }: ConnectReactionUsersListProps) {
  return (
    <div className="min-w-55 p-1.25">
      <p className="mb-0.75 text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-muted">
        Reacted with {emoji}
      </p>
      <div className="space-y-0.5">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-1">
            {user.avatar ? (
              // This remote avatar is decorative; Next Image cannot safely optimize arbitrary user-provided URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="" className="size-[22px] rounded-full object-cover" />
            ) : (
              <span className="grid size-[22px] place-items-center rounded-full bg-surface-raised text-[10px] font-bold text-text-secondary">
                {user.displayName.slice(0, 1)}
              </span>
            )}
            <div>
              <p className="text-xs font-bold text-text-primary">{user.displayName}</p>
              <p className="text-[11px] text-text-secondary">{user.jobTitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
