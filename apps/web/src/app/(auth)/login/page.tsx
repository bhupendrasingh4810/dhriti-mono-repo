"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Checkbox, FormControlLabel, Reveal, Stack, TextField, Typography } from "@dhriti/ui";

import { AuthShell } from "@/components/auth/AuthShell";

export default function LoginPage() {
  const router = useRouter();

  const onLoginClick = () => {
    router.push("/flowrise/home");
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue managing work, priorities, and momentum."
      footerText="Need an account?"
      footerLink="Create one"
      footerHref="/signup"
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
            <Link href="/forgot" style={{ color: "#1f2937", fontWeight: 700, fontSize: 14 }}>
              Forgot password?
            </Link>
          </Stack>

          <Button
          variant="contained"
          size="large"
          sx={{ bgcolor: "#fdd835", color: "#212121" }}
          onClick={onLoginClick}
          >
            Sign in
          </Button>
        </Stack>
      </Reveal>
    </AuthShell>
  );
}
