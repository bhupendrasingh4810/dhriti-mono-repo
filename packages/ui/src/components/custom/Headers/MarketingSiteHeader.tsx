"use client";

import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from "@mui/material";

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
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(229,231,235,0.9)",
        color: "#121212",
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
                  background: "#fdd835",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box sx={{ width: 16, height: 16, borderRadius: "50%", background: "#fff" }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: -0.6, color: "#121212" }}>
                {brandName}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={4} sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center" }}>
              {navItems.map((item) => (
                <Typography key={item} variant="body2" sx={{ fontWeight: 500, color: "#4b5563", cursor: "pointer" }}>
                  {item}
                </Typography>
              ))}
            </Stack>

            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Button
                component="a"
                href={signInHref}
                variant="text"
                sx={{ color: "#4b5563", fontWeight: 600, textTransform: "none" }}
              >
                Sign in
              </Button>
              <Button
                component="a"
                href={ctaHref}
                variant="contained"
                sx={{
                  background: "#fdd835",
                  color: "#121212",
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 800,
                  boxShadow: "none",
                  "&:hover": { background: "#facc15", boxShadow: "0 10px 24px rgba(253,216,53,0.28)" },
                }}
              >
                {ctaLabel}
              </Button>
            </Stack>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
