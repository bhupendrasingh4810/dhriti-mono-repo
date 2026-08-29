import { Box, Typography } from "@mui/material";

export default function AtlasPage() {
  return (
    <Box className="bg-[#f8fafc] min-h-screen">
      <Box sx={{ p: 4 }}>
        <Typography sx={{ fontSize: 30, fontWeight: 700 }}>Atlas</Typography>
        <Typography sx={{ mt: 1, color: "#6b7280" }}>Knowledge management workspace</Typography>
      </Box>
    </Box>
  );
}