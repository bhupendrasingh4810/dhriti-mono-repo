"use client";

import { Button, Reveal, Stack, TextField } from "@dhriti/ui";

import { AuthShell } from "@/components/auth/AuthLayout";

export default function ForgotPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email address associated with your account and we’ll send a reset link."
      footerText="Remember it?"
      footerLink="Log in"
      footerHref="/login"
      primaryAction="Back home"
    >
      <Reveal delay={0.12} duration={0.7}>
        <Stack spacing={2.5}>
          <TextField label="Email address" type="email" fullWidth />
          <Button variant="contained" size="large">
            Send reset link
          </Button>
        </Stack>
      </Reveal>
    </AuthShell>
  );
}
