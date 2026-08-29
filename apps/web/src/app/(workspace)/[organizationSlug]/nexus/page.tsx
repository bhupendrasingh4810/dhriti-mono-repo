import { Box, Typography } from "@mui/material";

export default function NexusPage() {
  return (
    <Box className="bg-[#f8fafc] min-h-screen">
      <Box sx={{ p: 4 }}>
        <Typography sx={{ fontSize: 30, fontWeight: 700 }}>Nexus</Typography>
        <Typography sx={{ mt: 1, color: "#6b7280" }}>Nexus workspace</Typography>
      </Box>
    </Box>
  );
}