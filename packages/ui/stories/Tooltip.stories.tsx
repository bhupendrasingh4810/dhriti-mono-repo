import type { Meta, StoryObj } from "@storybook/react-vite";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import BoltRounded from "@mui/icons-material/BoltRounded";
import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";

import { Tooltip, LightTooltip, WhiteTooltip } from "../src/components/mui/Tooltip";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Enterprise-grade Tooltip with Light (White) and Dark (Black) modes, 3 width sizes, keyboard shortcuts, rich descriptions, and semantic variants.",
      },
    },
  },
  args: {
    title: "Tooltip text",
    children: <Button variant="outlined">Hover me</Button>,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 1. VARIANTS (DARK VS LIGHT / WHITE)
// ============================================================================

export const Variants: Story = {
  render: () => (
    <Stack direction="row" spacing={3} sx={{ alignItems: "center", p: 4 }}>
      <Tooltip title="Dark tooltip (Default)" variant="dark" placement="top">
        <Button variant="contained">Dark / Black Tooltip</Button>
      </Tooltip>

      <Tooltip title="Clean white card tooltip" variant="light" placement="top">
        <Button variant="outlined">Light / White Tooltip</Button>
      </Tooltip>

      <WhiteTooltip title="WhiteTooltip convenience component" placement="top">
        <Button variant="outlined" color="secondary">
          WhiteTooltip Alias
        </Button>
      </WhiteTooltip>
    </Stack>
  ),
};

// ============================================================================
// 2. SIZES (SMALL, MEDIUM, LARGE)
// ============================================================================

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={3} sx={{ alignItems: "center", p: 4 }}>
      <Tooltip title="Compact single-word" size="small" variant="dark">
        <Button size="small" variant="outlined">
          Small (180px Max)
        </Button>
      </Tooltip>

      <Tooltip
        title="Standard medium tooltip"
        description="Ideal for standard explanations and quick hints."
        size="medium"
        variant="light"
      >
        <Button size="medium" variant="outlined">
          Medium (280px Max)
        </Button>
      </Tooltip>

      <Tooltip
        title="Comprehensive feature guide"
        description="Use large tooltips for rich, multi-sentence explanations, configuration tips, and onboarding assistance."
        size="large"
        variant="light"
      >
        <Button size="large" variant="contained">
          Large (420px Max)
        </Button>
      </Tooltip>
    </Stack>
  ),
};

// ============================================================================
// 3. PLACEMENTS
// ============================================================================

export const Placements: Story = {
  render: () => (
    <Box sx={{ width: 440, p: 4, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
      <Box />
      <Tooltip title="Top tooltip" placement="top" variant="dark">
        <Button fullWidth variant="outlined">
          Top
        </Button>
      </Tooltip>
      <Box />

      <Tooltip title="Left tooltip" placement="left" variant="dark">
        <Button fullWidth variant="outlined">
          Left
        </Button>
      </Tooltip>
      <Tooltip title="Center target" placement="top" variant="light">
        <Button fullWidth variant="contained">
          Center
        </Button>
      </Tooltip>
      <Tooltip title="Right tooltip" placement="right" variant="dark">
        <Button fullWidth variant="outlined">
          Right
        </Button>
      </Tooltip>

      <Box />
      <Tooltip title="Bottom tooltip" placement="bottom" variant="dark">
        <Button fullWidth variant="outlined">
          Bottom
        </Button>
      </Tooltip>
      <Box />
    </Box>
  ),
};

// ============================================================================
// 4. RICH CONTENT & KEYBOARD SHORTCUTS
// ============================================================================

export const RichContentAndShortcuts: Story = {
  render: () => (
    <Stack direction="row" spacing={3} sx={{ alignItems: "center", p: 4 }}>
      <Tooltip
        title="Copy API Token"
        description="Copies your Bearer token to system clipboard."
        shortcut="⌘C"
        icon={<ContentCopyRounded fontSize="inherit" />}
        variant="dark"
      >
        <IconButton sx={{ border: "1px solid", borderColor: "divider" }}>
          <ContentCopyRounded fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip
        title="Delete Selected Items"
        description="Permanently removes 14 selected items from this workspace. Cannot be undone."
        shortcut={["Shift", "Del"]}
        icon={<DeleteOutlineRounded fontSize="inherit" />}
        variant="light"
        size="medium"
      >
        <IconButton color="error" sx={{ border: "1px solid", borderColor: "error.light" }}>
          <DeleteOutlineRounded fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip
        title="AI Automation Assistant"
        description="Generate intelligent workflow steps and schema validations automatically."
        shortcut="⌘K"
        icon={<AutoAwesomeRounded fontSize="inherit" />}
        variant="primary"
        size="medium"
      >
        <Button variant="contained" startIcon={<AutoAwesomeRounded />}>
          Ask AI
        </Button>
      </Tooltip>
    </Stack>
  ),
};

// ============================================================================
// 5. SEMANTIC COLOR THEMES
// ============================================================================

export const SemanticColors: Story = {
  render: () => (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", p: 4 }}>
      <Tooltip title="Primary Brand Tooltip" variant="primary">
        <Button color="primary" variant="contained">
          Primary
        </Button>
      </Tooltip>

      <Tooltip title="Action completed successfully" variant="success">
        <Button color="success" variant="contained">
          Success
        </Button>
      </Tooltip>

      <Tooltip title="Warning: API limit nearing quota" variant="warning">
        <Button color="warning" variant="contained">
          Warning
        </Button>
      </Tooltip>

      <Tooltip title="Error: Authentication expired" variant="error">
        <Button color="error" variant="contained">
          Error
        </Button>
      </Tooltip>

      <Tooltip title="Information: Synced 2m ago" variant="info">
        <Button color="info" variant="contained">
          Info
        </Button>
      </Tooltip>
    </Stack>
  ),
};

// ============================================================================
// 6. INTERACTIVE WITH ACTIONS
// ============================================================================

export const InteractiveWithAction: Story = {
  render: () => (
    <Stack direction="row" spacing={3} sx={{ alignItems: "center", p: 4 }}>
      <Tooltip
        title="Advanced Table Filters"
        description="Customize column visibility, operator logic, and saved presets."
        variant="light"
        size="medium"
        interactive
        action={
          <Button size="small" variant="text" sx={{ p: 0, fontSize: "0.75rem", fontWeight: 700 }}>
            Configure Preset →
          </Button>
        }
      >
        <Button variant="outlined" startIcon={<SettingsRounded />}>
          Filter Settings
        </Button>
      </Tooltip>
    </Stack>
  ),
};
