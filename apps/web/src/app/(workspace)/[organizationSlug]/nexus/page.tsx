import { Box, Typography } from "@dhriti/ui";

export default function NexusPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "fontWeightBold" }}>Nexus</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>Nexus workspace</Typography>
      </Box>
    </Box>
  );
}