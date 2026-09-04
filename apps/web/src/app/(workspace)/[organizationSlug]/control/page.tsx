import { Box, Typography } from "@dhriti/ui";

export default function ControlPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: "fontWeightBold" }}>Control</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>Control workspace</Typography>
    </Box>
  );
}