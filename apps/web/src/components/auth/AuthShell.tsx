"use client";

import NextLink from "next/link";

import {
  Box,
  Card,
  Container,
  Divider,
  Link,
  Reveal,
  Stack,
  Typography,
} from "@dhriti/ui";
import { MarketingSiteHeader } from "@/components/marketing/MarketingSiteHeader";

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
}: AuthShellProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <MarketingSiteHeader
        navItems={["Product", "Solutions", "Resources", "Pricing", "Company"]}
        signInHref="/login"
        ctaHref="/signup"
        ctaLabel="Get Started"
      />

      <Container maxWidth="sm" sx={{ flex: 1, display: "flex", alignItems: "center", py: 6, px: 2 }}>
        <Reveal delay={0.08} duration={0.7}>
          <Card
            sx={{
              borderRadius: (theme) => theme.tokens.radius.lg,
              p: { xs: 2.5, sm: 4 },
              boxShadow: (theme) => theme.tokens.elevation.medium,
              borderColor: "borders.borderSubtle",
              bgcolor: "surfaces.surfaceElevated",
            }}
          >
            <Stack spacing={2.5}>
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
                <Link component={NextLink} href={footerHref}>
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
