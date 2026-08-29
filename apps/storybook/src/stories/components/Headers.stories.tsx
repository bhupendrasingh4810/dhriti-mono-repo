import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "@mui/material";
import { ConnectWorkspaceHeader, MarketingSiteHeader, WorkspaceAppsHeader } from "@dhriti/ui";

const meta: Meta = {
  title: "Components/Headers",
};

export default meta;
type Story = StoryObj;

const navItems = ["Solutions", "Products", "Pricing", "Resources"];

export const LandingHeader: Story = {
  render: () => (
    <Box sx={{ minHeight: 180, bgcolor: "#fff" }}>
      <MarketingSiteHeader navItems={navItems} brandName="Dhriti" signInHref="#" ctaHref="#" ctaLabel="Get Started" />
    </Box>
  ),
};

export const WorkspaceHeader: Story = {
  render: () => (
    <Box sx={{ minHeight: 180, bgcolor: "#f8fafc" }}>
      <WorkspaceAppsHeader appName="Home" />
    </Box>
  ),
};

export const ConnectHeader: Story = {
  render: () => (
    <Box sx={{ minHeight: 180, bgcolor: "#fff" }}>
      <ConnectWorkspaceHeader />
    </Box>
  ),
};
