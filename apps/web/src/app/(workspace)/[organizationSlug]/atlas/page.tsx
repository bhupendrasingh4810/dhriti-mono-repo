import { Box, Typography } from "@dhriti/ui";

export default function AtlasPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "fontWeightBold" }}>Atlas</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>Knowledge management workspace</Typography>
      </Box>
    </Box>
  );
}