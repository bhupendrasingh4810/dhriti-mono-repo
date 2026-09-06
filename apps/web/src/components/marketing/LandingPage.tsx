"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { alpha } from "@mui/material/styles";

import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  FloatCard,
  GlowButtonWrap,
  Link,
  Reveal,
  Stack,
  Typography,
} from "@dhriti/ui";

import { MarketingSiteHeader } from "./MarketingSiteHeader";

const navItems = ["Product", "Solutions", "Resources", "Pricing", "Company"];

const brands = ["ACME", "Velocity", "NEXORA", "Pinnacle", "InspireLabs", "CLOUDWAY"];

const featureCards = [
  {
    icon: "▣",
    title: "All-in-One Platform",
    text: "Chat, projects, docs, meetings, AI, and admin—unified in one seamless experience.",
    color: "warning.main",
    bg: "warning.light",
  },
  {
    icon: "⌕",
    title: "Context Everywhere",
    text: "Everything is connected, so you always have the right context when you need it.",
    color: "primary.main",
    bg: "surfaces.surfaceSelected",
  },
  {
    icon: "⚛",
    title: "AI That Understands",
    text: "Nexus AI learns your work and helps you make smarter, faster decisions.",
    color: "warning.dark",
    bg: "warning.light",
  },
  {
    icon: "◈",
    title: "Built for Scale",
    text: "From startups to enterprises, Dhriti grows with your organization.",
    color: "primary.main",
    bg: "surfaces.surfaceSelected",
  },
  {
    icon: "🔒",
    title: "Secure by Default",
    text: "Enterprise-grade security, permissions, and compliance built in.",
    color: "success.main",
    bg: "success.light",
  },
  {
    icon: "⎇",
    title: "Extensible & Open",
    text: "Integrate with your favorite tools and build on top of Dhriti.",
    color: "info.main",
    bg: "info.light",
  },
];

const productCards = [
  { name: "Connect", text: "Communicate and collaborate in real time.", image: "/connect.png" },
  { name: "Flow", text: "Plan, track, and deliver work efficiently.", image: "/flow.png" },
  { name: "Atlas", text: "Document, organize, and share knowledge effortlessly.", image: "/atlas.jpg" },
  { name: "Pulse", text: "Run better meetings and drive team alignment.", image: "/pulse.png" },
  { name: "Nexus", text: "AI-powered insights across your work graph.", image: "/nexus.png" },
];

const orbitPoints = [
  { label: "Connect", text: "Communicate seamlessly", position: { top: -10, left: 30 }, image: "/connect.png" },
  { label: "Pulse", text: "Meet & collaborate", position: { top: "25%", left: -30 }, image: "/pulse.png" },
  { label: "Nexus", text: "AI that works for you", position: { bottom: "25%", left: -30 }, image: "/nexus.png" },
  { label: "Atlas", text: "Knowledge that lasts", position: { bottom: "25%", right: -30 }, image: "/atlas.jpg" },
  { label: "Flow", text: "Plan & execute", position: { top: "25%", right: -30 }, image: "/flow.png" },
];

function IconBox({ children, bg, color }: { children: ReactNode; bg: string; color: string }) {
  return (
    <Box
      sx={{
        width: 52,
        height: 52,
        borderRadius: (theme) => theme.tokens.radius.lg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: bg,
        color,
        fontSize: 22,
        fontWeight: 700,
        mx: "auto",
      }}
    >
      {children}
    </Box>
  );
}

export default function LandingPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.paper", color: "text.primary" }}>
      <MarketingSiteHeader navItems={navItems} brandName="Dhriti" signInHref="/login" ctaHref="/get-started" ctaLabel="Get Started" />

      <Box sx={{ bgcolor: "surfaces.surfaceSelected", pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 }, px: 2 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={{ xs: 5, lg: 10 }} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Reveal sx={{ maxWidth: 620, width: "100%" }}>
              <Chip
                label="The Operating System for Modern Teams"
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: "text.primary",
                  border: 1,
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.28),
                  borderRadius: (theme) => theme.tokens.radius.pill,
                  px: 1,
                  py: 1.5,
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: 0.2,
                  mb: 3,
                }}
              />

              <Typography variant="h1" sx={{ fontSize: { xs: 44, md: 72, lg: 80 }, lineHeight: 1.05, fontWeight: 800, mb: 3 }}>
                One System.
                <br />
                Every Team.
                <br />
                <Box component="span" sx={{ color: "primary.main" }}>
                  Limitless Impact.
                </Box>
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, lineHeight: 1.7, maxWidth: 560, mb: 4 }}>
                Dhriti unifies communication, projects, knowledge, meetings, and AI in one seamless platform—so your teams can move faster and achieve more.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 6 }}>
                <GlowButtonWrap>
                  <Link component={NextLink} href="/get-started" underline="none">
                    <Button variant="contained" sx={{ px: 4, py: 1.8, fontWeight: 800 }}>
                      Get Started for Free
                    </Button>
                  </Link>
                </GlowButtonWrap>
                <Link component={NextLink} href="/login" underline="none">
                  <Button variant="outlined" sx={{ px: 4, py: 1.8, fontWeight: 800 }}>
                    Book a Demo
                  </Button>
                </Link>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ color: "text.secondary" }}>
                {[
                  "No credit card required",
                  "14-day free trial",
                  "Cancel anytime",
                ].map((item) => (
                  <Stack key={item} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />
                    <Typography variant="body2" color="text.secondary">{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Reveal>

            <FloatCard sx={{ position: "relative", width: "100%", maxWidth: 620 }}>
              <Box
                sx={{
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "borders.borderSubtle",
                  borderRadius: (theme) => theme.tokens.radius.xl,
                  p: 1.5,
                  transform: "rotate(-2deg)",
                  boxShadow: (theme) => theme.tokens.elevation.high,
                }}
              >
                <Box
                  component="img"
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_aa095f7d25_a75026192d4dbd0c.png"
                  alt="Dhriti dashboard"
                  sx={{ width: "100%", height: "auto", borderRadius: (theme) => theme.tokens.radius.lg, display: "block" }}
                />
              </Box>
            </FloatCard>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ py: 6, borderTop: 1, borderColor: "borders.borderSubtle" }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440, px: 2 }}>
          <Typography variant="body2" align="center" color="text.disabled" sx={{ fontWeight: 600, mb: 4 }}>
            Trusted by innovative teams at
          </Typography>
          <Stack direction="row" spacing={{ xs: 2, md: 6 }} sx={{ flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: { xs: 2, md: 5 } }}>
            {brands.map((brand) => (
              <Typography key={brand} variant="h5" sx={{ color: "text.secondary", opacity: 0.72, fontWeight: 800, textTransform: brand === "Velocity" ? "none" : "uppercase" }}>
                {brand}
              </Typography>
            ))}
          </Stack>
        </Container>
      </Box>

      <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", py: { xs: 8, md: 12 }, px: 2 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={{ xs: 6, lg: 12 }} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Reveal sx={{ maxWidth: 500 }}>
              <Typography variant="overline" sx={{ display: "block", mb: 2, fontWeight: 800, color: "inherit" }}>
                Built for the way teams work today
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.1, color: "inherit", mb: 2 }}>
                Everything connected.
                <br />
                Everything in context.
              </Typography>
              <Typography variant="h6" sx={{ color: "inherit", opacity: 0.8, lineHeight: 1.7, mb: 4 }}>
                Dhriti brings together the tools your team relies on every day—into one intelligent workspace.
              </Typography>

              <Stack spacing={2} sx={{ color: "inherit", fontWeight: 700 }}>
                {[
                  "Break down silos",
                  "Keep everyone aligned",
                  "Move faster with AI insights",
                ].map((item) => (
                  <Stack key={item} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: (theme) => alpha(theme.palette.primary.contrastText, 0.35), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                      ✓
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Reveal>

            <FloatCard sx={{ position: "relative", width: "100%", maxWidth: 640, height: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box sx={{ width: 450, height: 450, border: 1, borderColor: (theme) => alpha(theme.palette.primary.contrastText, 0.22), borderRadius: "50%", position: "absolute" }} />
              <Box
                sx={{
                  position: "absolute",
                  width: 170,
                  height: 170,
                  borderRadius: "50%",
                  bgcolor: "background.paper",
                  border: 8,
                  borderColor: (theme) => alpha(theme.palette.primary.contrastText, 0.45),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: (theme) => theme.tokens.elevation.high,
                  zIndex: 2,
                }}
              >
                <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "primary.main", mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary" }}>Dhriti</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                  The Work Graph
                </Typography>
              </Box>

              {orbitPoints.map((point) => (
                <Box
                  key={point.label}
                  sx={{
                    position: "absolute",
                    top: point.position.top,
                    left: point.position.left,
                    right: point.position.right,
                    bottom: point.position.bottom,
                    width: 180,
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "borders.borderSubtle",
                    borderRadius: (theme) => theme.tokens.radius.lg,
                    boxShadow: (theme) => theme.tokens.elevation.medium,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    zIndex: 3,
                  }}
                >
                  <Box sx={{ width: 42, height: 42, borderRadius: (theme) => theme.tokens.radius.md, border: 1, borderColor: "borders.border", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Box
                      component="img"
                      src={point.image}
                      alt={`${point.label} logo`}
                      sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{point.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{point.text}</Typography>
                  </Box>
                </Box>
              ))}
            </FloatCard>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 8, md: 12 }, px: 2 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip
              label="Powerful by Design"
              sx={{
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: "text.primary",
                border: 1,
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                borderRadius: (theme) => theme.tokens.radius.pill,
                fontWeight: 800,
                mb: 3,
              }}
            />
            <Typography variant="h2" sx={{ fontWeight: 800 }}>
              Designed to help your team thrive
            </Typography>
          </Box>

          <Stack direction="row" sx={{ flexWrap: "wrap", justifyContent: "center", gap: 3 }}>
            {featureCards.map((card) => (
              <Box key={card.title} sx={{ width: { xs: "100%", sm: "48%", xl: "15.5%" }, minWidth: 180 }}>
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <IconBox bg={card.bg} color={card.color}>{card.icon}</IconBox>
                  <Typography variant="h6" sx={{ fontWeight: 800, mt: 2, mb: 1 }}>{card.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{card.text}</Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      <Box sx={{ bgcolor: "background.default", py: { xs: 8, md: 12 }, px: 2 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              One platform. Seven apps.
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800 }}>
              The Dhriti Product Suite
            </Typography>
          </Box>

          <Stack direction="row" sx={{ justifyContent: "center", flexWrap: "wrap", gap: 2, mb: 8 }}>
            {productCards.map((card) => (
              <Box key={card.name} sx={{ width: { xs: "46%", sm: "30%", md: "18%" }, minWidth: 180 }}>
                <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "borders.border", borderRadius: (theme) => theme.tokens.radius.lg, p: 3, textAlign: "center", height: "100%" }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: (theme) => theme.tokens.radius.lg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "background.paper",
                      border: 1,
                      borderColor: "borders.border",
                      mx: "auto",
                      mb: 2,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      component="img"
                      src={card.image}
                      alt={`${card.name} logo`}
                      sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{card.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{card.text}</Typography>
                </Box>
              </Box>
            ))}
          </Stack>

          <Box sx={{ bgcolor: "grey.900", borderRadius: (theme) => theme.tokens.radius.xl, p: { xs: 3, md: 5 }, position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", inset: 0, background: (theme) => `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.18)}, transparent 60%)` }} />
            <Stack direction={{ xs: "column", lg: "row" }} spacing={5} sx={{ alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
              <Box sx={{ maxWidth: 520 }}>
                <Typography variant="overline" sx={{ color: "primary.light", fontWeight: 800 }}>Ready to get started?</Typography>
                <Typography variant="h2" sx={{ fontWeight: 800, color: "common.white", lineHeight: 1.1 }}>
                  Your team&apos;s best work starts here.
                </Typography>
                <Typography variant="body1" sx={{ color: "grey.400", mt: 2 }}>
                  Join thousands of teams already using Dhriti to work smarter, together.
                </Typography>
              </Box>

              <Box sx={{ width: "100%", maxWidth: 560 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                  <Box component="input" placeholder="Enter your work email" sx={{ flex: 1, bgcolor: (theme) => alpha(theme.palette.common.white, 0.08), color: "common.white", border: 1, borderColor: (theme) => alpha(theme.palette.common.white, 0.18), borderRadius: (theme) => theme.tokens.radius.md, px: 2, py: 1.75, outline: "none", fontSize: 16 }} />
                  <Button variant="contained" sx={{ px: 3, py: 1.75, fontWeight: 800 }}>
                    Get Started for Free
                  </Button>
                </Stack>

                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", color: "grey.400" }}>
                  {[
                    "No credit card required",
                    "14-day free trial",
                    "Cancel anytime",
                  ].map((item) => (
                    <Stack key={item} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "primary.light" }} />
                      <Typography variant="caption" sx={{ color: "grey.300" }}>{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Box component="footer" sx={{ bgcolor: "background.paper", borderTop: 1, borderColor: "borders.borderSubtle", px: 2, py: { xs: 8, md: 12 } }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={6} sx={{ justifyContent: "space-between" }}>
            <Box sx={{ maxWidth: 420 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 3 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "primary.contrastText" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Dhriti</Typography>
              </Stack>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                The operating system for modern teams. One platform to connect, collaborate, and achieve more.
              </Typography>
            </Box>

            <Stack direction="row" spacing={{ xs: 4, md: 6 }} sx={{ flexWrap: "wrap", justifyContent: "space-between", flex: 1 }}>
              {[
                ["Product", ["Overview", "Features", "Apps", "Integrations", "Roadmap"]],
                ["Solutions", ["By Team", "By Use Case", "Enterprise", "Remote Teams", "Startups"]],
                ["Resources", ["Documentation", "Blog", "Guides", "Templates", "Help Center"]],
                ["Company", ["About Us", "Careers", "Customers", "Partners", "Contact"]],
                ["Legal", ["Privacy Policy", "Terms of Service", "Security", "Status"]],
              ].map(([title, items]) => (
                <Box key={title as string} sx={{ minWidth: 140 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>{title as string}</Typography>
                  <Stack spacing={1.5}>
                    {(items as string[]).map((item) => (
                      <Typography key={item} variant="body2" color="text.secondary">{item}</Typography>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Stack>

          <Divider sx={{ my: 4 }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.disabled">
              © 2025 Dhriti. All rights reserved.
            </Typography>
            {/* <Typography variant="body2" color="text.disabled">
              Made with <Box component="span" sx={{ color: "primary.main" }}>💛</Box> for modern teams
            </Typography> */}
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
