"use client";

import { Button, Checkbox, FormControlLabel, Reveal, Stack, TextField, Typography } from "@dhriti/ui";

import { AuthShell } from "@/components/auth/AuthShell";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your workspace and bring your team under one operating rhythm."
      footerText="Already have an account?"
      footerLink="Log in"
      footerHref="/login"
      primaryAction="Back home"
    >
      <Reveal delay={0.14} duration={0.75}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="First name" fullWidth />
            <TextField label="Last name" fullWidth />
          </Stack>
          <TextField label="Work email" type="email" fullWidth />
          <TextField label="Password" type="password" fullWidth />
          <FormControlLabel
            control={<Checkbox />}
            label={<Typography variant="body2">I agree to the terms and privacy policy</Typography>}
          />
          <Button variant="contained" size="large" sx={{ bgcolor: "#fdd835", color: "#212121" }}>
            Create account
          </Button>
        </Stack>
      </Reveal>
    </AuthShell>
  );
}
