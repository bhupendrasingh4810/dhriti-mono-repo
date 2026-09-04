"use client";

import { Button, Reveal, Stack, TextField } from "@dhriti/ui";

import { AuthShell } from "@/components/auth/AuthShell";

export default function EmailVerificationPage() {
  return (
    <AuthShell
      title="Verify your email"
      subtitle="We sent a one-time code to your inbox. Enter it below to finish your setup."
      footerText="Didn’t receive it?"
      footerLink="Resend code"
      footerHref="/login"
      primaryAction="Back home"
    >
      <Reveal delay={0.12} duration={0.75}>
        <Stack spacing={2.5}>
          <TextField label="Verification code" fullWidth />
          <Button variant="contained" size="large">
            Verify email
          </Button>
        </Stack>
      </Reveal>
    </AuthShell>
  );
}
