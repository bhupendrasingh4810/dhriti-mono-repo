import { Box, Typography } from "@dhriti/ui";

export default function FlowPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: "fontWeightBold" }}>Flow</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>Flow workspace</Typography>
    </Box>
  );
}