"use client";

import Link from "next/link";

import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Reveal,
  Stack,
  Typography,
} from "@dhriti/ui";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLink: string;
  footerHref: string;
  primaryAction?: string;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  footerHref,
  primaryAction,
}: AuthShellProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, rgba(253, 216, 53, 0.2), transparent 35%), linear-gradient(180deg, #fffdf3 0%, #f8fafc 100%)",
        px: 2,
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        <Reveal delay={0.08} duration={0.7}>
          <Card
            sx={{
              borderRadius: 4,
              p: { xs: 2.5, sm: 4 },
              boxShadow: "0 25px 70px rgba(15, 23, 42, 0.08)",
              border: "1px solid rgba(253, 216, 53, 0.14)",
              background: "rgba(255,255,255,0.9)",
            }}
          >
            <Stack spacing={2.5}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>
                  Dhriti
                </Typography>
                {primaryAction ? (
                  <Link href="/" style={{ textDecoration: "none" }}>
                    <Button variant="text" size="small">
                      {primaryAction}
                    </Button>
                  </Link>
                ) : null}
              </Stack>

              <Stack spacing={1}>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  {title}
                </Typography>
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  {subtitle}
                </Typography>
              </Stack>

              {children}

              <Divider flexItem />

              <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {footerText}
                </Typography>
                <Link href={footerHref} style={{ color: "#fdd835", fontWeight: 700 }}>
                  {footerLink}
                </Link>
              </Stack>
            </Stack>
          </Card>
        </Reveal>
      </Container>
    </Box>
  );
}
