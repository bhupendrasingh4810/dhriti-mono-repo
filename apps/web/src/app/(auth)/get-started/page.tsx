"use client";

import { Button, Checkbox, FormControlLabel, Reveal, Stack, TextField, Typography } from "@dhriti/ui";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { useState } from "react";

export default function GetStartedPage() {
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    agreeToTerms: false,
  });

  return (
    <AuthLayout
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
            <TextField
              label="Name"
              fullWidth
              value={signupData.name}
              onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
            />
          </Stack>
          <TextField
            label="Work email"
            type="email"
            fullWidth
            value={signupData.email}
            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={signupData.password}
            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={signupData.agreeToTerms}
                onChange={(e) => setSignupData({ ...signupData, agreeToTerms: e.target.checked })}
              />
            }
            label={<Typography variant="body2">I agree to the terms and privacy policy</Typography>}
          />
          <Button variant="contained" size="large">
            Create account
          </Button>
        </Stack>
      </Reveal>
    </AuthLayout>
  );
}
