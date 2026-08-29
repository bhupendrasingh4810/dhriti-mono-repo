import type { ReactNode } from "react";
import Link from "next/link";

import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  FloatCard,
  GlowButtonWrap,
  MarketingSiteHeader,
  Reveal,
  Stack,
  Typography,
} from "@dhriti/ui";

const navItems = ["Product", "Solutions", "Resources", "Pricing", "Company"];

const brands = ["ACME", "Velocity", "NEXORA", "Pinnacle", "InspireLabs", "CLOUDWAY"];

const featureCards = [
  {
    icon: "▣",
    title: "All-in-One Platform",
    text: "Chat, projects, docs, meetings, AI, and admin—unified in one seamless experience.",
    color: "#f59e0b",
    bg: "#fff7ed",
  },
  {
    icon: "⌕",
    title: "Context Everywhere",
    text: "Everything is connected, so you always have the right context when you need it.",
    color: "#fbbf24",
    bg: "#fefce8",
  },
  {
    icon: "⚛",
    title: "AI That Understands",
    text: "Nexus AI learns your work and helps you make smarter, faster decisions.",
    color: "#f97316",
    bg: "#fff7ed",
  },
  {
    icon: "◈",
    title: "Built for Scale",
    text: "From startups to enterprises, Dhriti grows with your organization.",
    color: "#facc15",
    bg: "#fef9c3",
  },
  {
    icon: "🔒",
    title: "Secure by Default",
    text: "Enterprise-grade security, permissions, and compliance built in.",
    color: "#fbbf24",
    bg: "#fefce8",
  },
  {
    icon: "⎇",
    title: "Extensible & Open",
    text: "Integrate with your favorite tools and build on top of Dhriti.",
    color: "#f59e0b",
    bg: "#fff7ed",
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
  // { label: "Control", text: "Secure & govern", position: { top: "25%", left: -30 }, color: "#60a5fa", bg: "#eff6ff" },
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
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
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
    <Box sx={{ minHeight: "100vh", background: "#fff", color: "#121212" }}>
      <MarketingSiteHeader navItems={navItems} brandName="Dhriti" signInHref="/login" ctaHref="/signup" ctaLabel="Get Started" />

      <Box sx={{ background: "#fffdf2", pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 }, px: 2 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={{ xs: 5, lg: 10 }} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Reveal sx={{ maxWidth: 620, width: "100%" }}>
              <Chip
                label="The Operating System for Modern Teams"
                sx={{
                  background: "rgba(253,216,53,0.12)",
                  color: "#1f2937",
                  border: "1px solid rgba(253,216,53,0.28)",
                  borderRadius: 999,
                  px: 1,
                  py: 1.5,
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: 0.2,
                  mb: 3,
                }}
              />

              <Typography variant="h1" sx={{ fontSize: { xs: 44, md: 72, lg: 80 }, lineHeight: 1.05, letterSpacing: -3, fontWeight: 800, mb: 3 }}>
                One System.
                <br />
                Every Team.
                <br />
                <Box component="span" sx={{ color: "#fdd835" }}>
                  Limitless Impact.
                </Box>
              </Typography>

              <Typography variant="h6" sx={{ color: "#4b5563", fontWeight: 400, lineHeight: 1.7, maxWidth: 560, mb: 4 }}>
                Dhriti unifies communication, projects, knowledge, meetings, and AI in one seamless platform—so your teams can move faster and achieve more.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 6 }}>
                <GlowButtonWrap>
                  <Link href="/signup" style={{ textDecoration: "none" }}>
                    <Button
                      variant="contained"
                      sx={{
                        background: "#fdd835",
                        color: "#121212",
                        px: 4,
                        py: 1.8,
                        borderRadius: 2,
                        fontWeight: 800,
                        textTransform: "none",
                        boxShadow: "none",
                        "&:hover": { background: "#facc15" },
                      }}
                    >
                      Get Started for Free
                    </Button>
                  </Link>
                </GlowButtonWrap>
                <Link href="/login" style={{ textDecoration: "none" }}>
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: "#e5e7eb",
                      color: "#121212",
                      px: 4,
                      py: 1.8,
                      borderRadius: 2,
                      fontWeight: 800,
                      background: "#fff",
                      textTransform: "none",
                    }}
                  >
                    Book a Demo
                  </Button>
                </Link>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ color: "#6b7280", fontSize: 14 }}>
                {[
                  "No credit card required",
                  "14-day free trial",
                  "Cancel anytime",
                ].map((item) => (
                  <Stack key={item} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#fdd835" }} />
                    <Typography variant="body2" sx={{ color: "#4b5563" }}>{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Reveal>

            <FloatCard sx={{ position: "relative", width: "100%", maxWidth: 620 }}>
              <Box
                sx={{
                  background: "#fff",
                  border: "1px solid #f1f5f9",
                  borderRadius: 4,
                  p: 1.5,
                  transform: "rotate(-2deg)",
                  boxShadow: "0 30px 80px rgba(15,23,42,0.12)",
                }}
              >
                <Box
                  component="img"
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_aa095f7d25_a75026192d4dbd0c.png"
                  alt="Dhriti dashboard"
                  sx={{ width: "100%", height: "auto", borderRadius: 3, display: "block" }}
                />
              </Box>
            </FloatCard>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ py: 6, borderTop: "1px solid #f3f4f6" }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440, px: 2 }}>
          <Typography variant="body2" align="center" sx={{ color: "#9ca3af", fontWeight: 600, mb: 4 }}>
            Trusted by innovative teams at
          </Typography>
          <Stack direction="row" spacing={{ xs: 2, md: 6 }} sx={{ flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: { xs: 2, md: 5 } }}>
            {brands.map((brand) => (
              <Typography key={brand} variant="h5" sx={{ color: "#374151", opacity: 0.72, fontWeight: 800, letterSpacing: -1, textTransform: brand === "Velocity" ? "none" : "uppercase" }}>
                {brand}
              </Typography>
            ))}
          </Stack>
        </Container>
      </Box>

      <Box sx={{ background: "#fdd835", py: { xs: 8, md: 12 }, px: 2 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={{ xs: 6, lg: 12 }} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Reveal sx={{ maxWidth: 500 }}>
              <Typography variant="overline" sx={{ display: "block", mb: 2, letterSpacing: 2, fontWeight: 800, color: "#1f2937" }}>
                Built for the way teams work today
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: -2, color: "#121212", mb: 2 }}>
                Everything connected.
                <br />
                Everything in context.
              </Typography>
              <Typography variant="h6" sx={{ color: "rgba(17,24,39,0.8)", lineHeight: 1.7, mb: 4 }}>
                Dhriti brings together the tools your team relies on every day—into one intelligent workspace.
              </Typography>

              <Stack spacing={2} sx={{ color: "#121212", fontWeight: 700 }}>
                {[
                  "Break down silos",
                  "Keep everyone aligned",
                  "Move faster with AI insights",
                ].map((item) => (
                  <Stack key={item} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                      ✓
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Reveal>

            <FloatCard sx={{ position: "relative", width: "100%", maxWidth: 640, height: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box sx={{ width: 450, height: 450, border: "1px solid rgba(17,24,39,0.11)", borderRadius: "50%", position: "absolute" }} />
              <Box
                sx={{
                  position: "absolute",
                  width: 170,
                  height: 170,
                  borderRadius: "50%",
                  background: "#fff",
                  border: "8px solid rgba(255,255,255,0.45)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 30px 60px rgba(15,23,42,0.12)",
                  zIndex: 2,
                }}
              >
                <Box sx={{ width: 32, height: 32, borderRadius: "50%", background: "#fdd835", mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#121212" }}>Dhriti</Typography>
                <Typography variant="caption" sx={{ color: "#6b7280", letterSpacing: 1.2, textTransform: "uppercase" }}>
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
                    background: "#fff",
                    border: "1px solid #f1f5f9",
                    borderRadius: 3,
                    boxShadow: "0 16px 32px rgba(15,23,42,0.08)",
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    zIndex: 3,
                  }}
                >
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, border: "1px solid #e5e7eb", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Box
                      component="img"
                      src={point.image}
                      alt={`${point.label} logo`}
                      sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#121212" }}>{point.label}</Typography>
                    <Typography variant="caption" sx={{ color: "#6b7280" }}>{point.text}</Typography>
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
                background: "rgba(253,216,53,0.1)",
                color: "#1f2937",
                border: "1px solid rgba(253,216,53,0.3)",
                borderRadius: 999,
                fontWeight: 800,
                mb: 3,
              }}
            />
            <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: -2, color: "#121212" }}>
              Designed to help your team thrive
            </Typography>
          </Box>

          <Stack direction="row" sx={{ flexWrap: "wrap", justifyContent: "center", gap: 3 }}>
            {featureCards.map((card) => (
              <Box key={card.title} sx={{ width: { xs: "100%", sm: "48%", xl: "15.5%" }, minWidth: 180 }}>
                <Box sx={{ textAlign: "center", py: 3 }}>
                  <IconBox bg={card.bg} color={card.color}>{card.icon}</IconBox>
                  <Typography variant="h6" sx={{ fontWeight: 800, mt: 2, mb: 1, color: "#121212" }}>{card.title}</Typography>
                  <Typography variant="body2" sx={{ color: "#6b7280", lineHeight: 1.7 }}>{card.text}</Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      <Box sx={{ background: "#f8fafc", py: { xs: 8, md: 12 }, px: 2 }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="overline" sx={{ letterSpacing: 2, color: "#6b7280", fontWeight: 700 }}>
              One platform. Seven apps.
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: -2, color: "#121212" }}>
              The Dhriti Product Suite
            </Typography>
          </Box>

          <Stack direction="row" sx={{ justifyContent: "center", flexWrap: "wrap", gap: 2, mb: 8 }}>
            {productCards.map((card) => (
              <Box key={card.name} sx={{ width: { xs: "46%", sm: "30%", md: "18%" }, minWidth: 180 }}>
                <Box sx={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 3, p: 3, textAlign: "center", height: "100%" }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
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
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#121212", mb: 1 }}>{card.name}</Typography>
                  <Typography variant="body2" sx={{ color: "#6b7280", lineHeight: 1.6 }}>{card.text}</Typography>
                </Box>
              </Box>
            ))}
          </Stack>

          <Box sx={{ background: "#0a0a0a", borderRadius: 5, p: { xs: 3, md: 5 }, position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(253,216,53,0.18), transparent 60%)" }} />
            <Stack direction={{ xs: "column", lg: "row" }} spacing={5} sx={{ alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
              <Box sx={{ maxWidth: 520 }}>
                <Typography variant="overline" sx={{ color: "#fdd835", fontWeight: 800, letterSpacing: 2 }}>Ready to get started?</Typography>
                <Typography variant="h2" sx={{ fontWeight: 800, letterSpacing: -2, color: "#fff", lineHeight: 1.1 }}>
                  Your team&apos;s best work starts here.
                </Typography>
                <Typography variant="body1" sx={{ color: "#9ca3af", mt: 2 }}>
                  Join thousands of teams already using Dhriti to work smarter, together.
                </Typography>
              </Box>

              <Box sx={{ width: "100%", maxWidth: 560 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                  <Box component="input" placeholder="Enter your work email" sx={{ flex: 1, background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 2, px: 2, py: 1.75, outline: "none", fontSize: 16 }} />
                  <Button
                    variant="contained"
                    sx={{
                      background: "#fdd835",
                      color: "#121212",
                      px: 3,
                      py: 1.75,
                      borderRadius: 2,
                      fontWeight: 800,
                      textTransform: "none",
                    }}
                  >
                    Get Started for Free
                  </Button>
                </Stack>

                <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", color: "#9ca3af", fontSize: 12 }}>
                  {[
                    "No credit card required",
                    "14-day free trial",
                    "Cancel anytime",
                  ].map((item) => (
                    <Stack key={item} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: "#fdd835" }} />
                      <Typography variant="caption" sx={{ color: "#d1d5db" }}>{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Box component="footer" sx={{ background: "#fff", borderTop: "1px solid #f3f4f6", px: 2, py: { xs: 8, md: 12 } }}>
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={6} sx={{ justifyContent: "space-between" }}>
            <Box sx={{ maxWidth: 420 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 3 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: "50%", background: "#fdd835", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: "50%", background: "#fff" }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#121212" }}>Dhriti</Typography>
              </Stack>
              <Typography variant="body1" sx={{ color: "#6b7280", lineHeight: 1.8 }}>
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
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#121212", mb: 2 }}>{title as string}</Typography>
                  <Stack spacing={1.5}>
                    {(items as string[]).map((item) => (
                      <Typography key={item} variant="body2" sx={{ color: "#6b7280" }}>{item}</Typography>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Stack>

          <Divider sx={{ my: 4 }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
              © 2025 Dhriti. All rights reserved.
            </Typography>
            <Typography variant="body2" sx={{ color: "#9ca3af" }}>
              Made with <Box component="span" sx={{ color: "#fdd835" }}>💛</Box> for modern teams
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
