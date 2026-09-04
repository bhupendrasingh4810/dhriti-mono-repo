"use client";

import NextLink from "next/link";
import { AppBar, Box, Button, Container, Link, Stack, Toolbar, Typography } from "@dhriti/ui";

type MarketingSiteHeaderProps = {
  navItems: string[];
  brandName?: string;
  signInHref?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function MarketingSiteHeader({
  navItems,
  brandName = "Dhriti",
  signInHref = "/login",
  ctaHref = "/signup",
  ctaLabel = "Get Started",
}: MarketingSiteHeaderProps) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: 1,
        borderColor: "borders.borderSubtle",
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: 1440, px: { xs: 2, md: 3 } }}>
        <Toolbar disableGutters sx={{ minHeight: 88, px: 0 }}>
          <Stack direction="row" sx={{ width: "100%", alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "primary.contrastText" }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: "fontWeightBold" }}>
                {brandName}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={4} sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center" }}>
              {navItems.map((item) => (
                <Typography key={item} variant="body2" color="text.secondary" sx={{ fontWeight: 500, cursor: "pointer" }}>
                  {item}
                </Typography>
              ))}
            </Stack>

            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Link component={NextLink} href={signInHref} underline="none">
                <Button variant="text" sx={{ fontWeight: 600 }}>
                  Sign in
                </Button>
              </Link>
              <Link component={NextLink} href={ctaHref} underline="none">
                <Button variant="contained" sx={{ px: 3, py: 1.5, fontWeight: "fontWeightBold" }}>
                  {ctaLabel}
                </Button>
              </Link>
            </Stack>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}