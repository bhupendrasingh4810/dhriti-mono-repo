"use client";

import { useState } from "react";
import { Dialog, DhritiButton, DhritiSelectMenu, DhritiTextField } from "@dhriti/ui";
import { controlPlatformService } from "@/services/control.service";

export type RunSecurityAction = (action: () => Promise<void>, success: string) => Promise<void>;

export function SecurityBlockDialog({
  ip,
  busy,
  run,
  onClose,
}: {
  ip: string;
  busy: boolean;
  run: RunSecurityAction;
  onClose: () => void;
}) {
  const [address, setAddress] = useState(ip);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("24");
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<{ address?: string; reason?: string }>({});
  return (
    <Dialog open title="Block IP address" onClose={onClose} isSubmitting={busy} secondaryActionLabel="">
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const next = {
            address: address.trim() ? undefined : "IP address is required.",
            reason: reason.trim() ? undefined : "Block reason is required.",
          };
          setErrors(next);
          if (next.address || next.reason) return;
          const expiresAt = duration ? new Date(Date.now() + Number(duration) * 3600000).toISOString() : undefined;
          void run(async () => {
            await controlPlatformService.blockIp(address.trim(), reason.trim(), expiresAt);
            onClose();
          }, `IP ${address.trim()} has been blocked`);
        }}
      >
        <DhritiTextField
          label="IP address to block"
          required
          disabled={busy}
          value={address}
          error={errors.address}
          onChange={setAddress}
        />
        <DhritiTextField
          label="Block reason"
          required
          disabled={busy}
          maxLength={500}
          value={reason}
          error={errors.reason}
          onChange={setReason}
        />
        <DhritiSelectMenu
          label="Block duration"
          disabled={busy}
          value={duration}
          onChange={(value) => setDuration(value ?? "24")}
          open={open}
          onOpenChange={setOpen}
          options={[
            { value: "1", label: "1 hour" },
            { value: "24", label: "24 hours" },
            { value: "168", label: "7 days" },
            { value: "", label: "Until manually unblocked" },
          ]}
        />
        <p className="text-sm text-text-secondary">
          Individual IP addresses only. You cannot block your current IP. Expired blocks stop applying automatically.
        </p>
        <div className="flex justify-end gap-2">
          <DhritiButton variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </DhritiButton>
          <DhritiButton type="submit" variant="danger" disabled={busy}>
            Confirm IP block
          </DhritiButton>
        </div>
      </form>
    </Dialog>
  );
}
