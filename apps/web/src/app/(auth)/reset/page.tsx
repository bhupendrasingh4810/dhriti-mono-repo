"use client";

import { Button, Reveal, Stack, TextField } from "@dhriti/ui";

import { AuthShell } from "@/components/auth/AuthShell";

export default function ResetPage() {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password to secure your account."
      footerText="Need help?"
      footerLink="Contact support"
      footerHref="/login"
      primaryAction="Back home"
    >
      <Reveal delay={0.12} duration={0.75}>
        <Stack spacing={2.5}>
          <TextField label="New password" type="password" fullWidth />
          <TextField label="Confirm password" type="password" fullWidth />
          <Button variant="contained" size="large" sx={{ bgcolor: "#fdd835", color: "#212121" }}>
            Update password
          </Button>
        </Stack>
      </Reveal>
    </AuthShell>
  );
}
