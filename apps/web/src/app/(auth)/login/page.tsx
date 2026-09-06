"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Button, Checkbox, FormControlLabel, Link, Reveal, Stack, TextField, Typography } from "@dhriti/ui";

import { AuthLayout } from "@/components/auth/AuthLayout";

export default function LoginPage() {
  const router = useRouter();

  const onLoginClick = () => {
    router.push("/flowrise/home");
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue managing work, priorities, and momentum."
      footerText="Need an account?"
      footerLink="Create one"
      footerHref="/get-started"
      primaryAction="Back home"
    >
      <Reveal delay={0.14} duration={0.7}>
        <Stack spacing={2.5}>
          <TextField label="Email address" type="email" fullWidth />
          <TextField label="Password" type="password" fullWidth />

          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <FormControlLabel
              control={<Checkbox />}
              label={<Typography variant="body2">Remember me</Typography>}
            />
            <Link component={NextLink} href="/forgot" variant="body2">
              Forgot password?
            </Link>
          </Stack>

          <Button
            variant="contained"
            size="large"
            onClick={onLoginClick}
          >
            Sign in
          </Button>
        </Stack>
      </Reveal>
    </AuthLayout>
  );
}
