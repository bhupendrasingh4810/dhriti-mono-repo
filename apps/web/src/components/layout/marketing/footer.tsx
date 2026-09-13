
import { Box, Container, Stack, Typography, Divider } from "@dhriti/ui";

export const Footer = () => {
    return (
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
    );
};