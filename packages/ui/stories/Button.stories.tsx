/**
 * Button Component Stories
 * 
 * Comprehensive Storybook documentation for Dhriti Button component.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  AddRounded,
  ArrowForwardRounded,
  CheckRounded,
  CloseRounded,
  DeleteRounded,
  DownloadRounded,
  EditRounded,
  FavoriteRounded,
  HomeRounded,
  MenuRounded,
  MoreVertRounded,
  NotificationsRounded,
  SaveRounded,
  SearchRounded,
  SendRounded,
  SettingsRounded,
  ShareRounded,
  StarRounded,
  VisibilityRounded,
} from "@mui/icons-material";

import { Button } from "../src/components/mui";

const meta = {
  title: "Form Elements/Button",
  component: Button,

  parameters: {
    layout: "centered",
  },

  args: {
    children: "Continue",
    variant: "contained",
    color: "primary",
  },

  argTypes: {
    children: {
      control: "text",
    },

    variant: {
      control: "select",
      options: ["contained", "outlined", "text"],
    },

    color: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "success",
        "error",
        "info",
        "warning",
        "inherit",
      ],
    },

    size: {
      control: "select",
      options: ["small", "medium", "large"],
    },

    fullWidth: {
      control: "boolean",
    },

    disabled: {
      control: "boolean",
    },

    loading: {
      control: "boolean",
    },

    loadingText: {
      control: "text",
    },

    loadingPosition: {
      control: "select",
      options: ["start", "end", "center"],
    },

    iconOnly: {
      control: "boolean",
    },

    startIcon: {
      control: false,
    },

    endIcon: {
      control: false,
    },

    icon: {
      control: false,
    },

    loader: {
      control: false,
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

// ============================================================================
// DEFAULT
// ============================================================================

export const Default: Story = {
  name: "Default",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="contained" color="primary">
        Primary
      </Button>

      <Button variant="contained" color="secondary">
        Secondary
      </Button>

      <Button variant="contained" color="success" disabled>
        Disabled
      </Button>

      <Button variant="contained" color="error">
        Link
      </Button>
    </div>
  ),
};

// ============================================================================
// Colors
// ============================================================================

export const Colors: Story = {
  name: "Colors",
  render: () => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
      <Button variant="contained" color="primary">
        Primary
      </Button>

      <Button variant="contained" color="secondary">
        Secondary
      </Button>

      <Button variant="contained" color="success">
        Success
      </Button>

      <Button variant="contained" color="error">
        Error
      </Button>

      <Button variant="contained" color="info">
        Info
      </Button>

      <Button variant="contained" color="warning">
        Warning
      </Button>

      <Button variant="contained" color="inherit">
        Inherit
      </Button>
    </div>
  ),
};

// ============================================================================
// LOADING BUTTON
// ============================================================================

export const LoadingButtons: Story = {
  name: "Loading Buttons",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="contained" loading loadingPosition="start">
        Loading
      </Button>
      <Button variant="contained" loading loadingPosition="end">
        Loading
      </Button>
      <Button variant="contained" loading loadingPosition="center">
        Loading
      </Button>
      <Button variant="contained" loading loadingText="Processing...">
        Loading
      </Button>
    </div>
  ),
};

// ============================================================================
// SIZES
// ============================================================================

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="contained" size="small">
        Small
      </Button>
      <Button variant="contained" size="medium">
        Medium
      </Button>
      <Button variant="contained" size="large">
        Large
      </Button>
    </div>
  ),
};

// ============================================================================
// OUTLINED
// ============================================================================

export const Outlined: Story = {
  name: "Outlined",
  render: () => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
      <Button variant="outlined" color="primary">
        Primary
      </Button>

      <Button variant="outlined" color="secondary">
        Secondary
      </Button>

      <Button variant="outlined" color="success">
        Success
      </Button>

      <Button variant="outlined" color="error">
        Error
      </Button>

      <Button variant="outlined" color="info">
        Info
      </Button>

      <Button variant="outlined" color="warning">
        Warning
      </Button>

      <Button variant="outlined" color="inherit">
        Inherit
      </Button>
    </div>
  ),
};

// ============================================================================
// OUTLINED ICON
// ============================================================================

export const OutlinedIcon: Story = {
  name: "Outlined Icon",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="outlined" color="primary" startIcon={<DeleteRounded />}>
        Start Icon
      </Button>

      <Button variant="outlined" color="secondary" endIcon={<SendRounded />}>
        End Icon
      </Button>

    </div>
  ),
};

// ============================================================================
// OUTLINE SIZE
// ============================================================================

export const OutlinedSize: Story = {
  name: "Outlined Size",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="outlined" size="small">
        Small
      </Button>

      <Button variant="outlined" size="medium">
        Medium
      </Button>

      <Button variant="outlined" size="large">
        Large
      </Button>
    </div>
  ),
};

// ============================================================================
// TEXT
// ============================================================================

export const Text: Story = {
  name: "Text",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="text" color="primary">
        Primary
      </Button>

      <Button variant="text" color="secondary">
        Secondary
      </Button>

      <Button variant="text" color="success" disabled>
        Disabled
      </Button>

      <Button variant="text" color="error">
        Link
      </Button>
    </div>
  ),
};

// ============================================================================
// TEXT COLOR
// ============================================================================

export const TextColor: Story = {
  name: "Text Color",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="text" color="primary">
        Primary
      </Button>

      <Button variant="text" color="secondary">
        Secondary
      </Button>

      <Button variant="text" color="error">
        Error
      </Button>

      <Button variant="text" color="warning">
        Warning
      </Button>

      <Button variant="text" color="success">
        Success
      </Button>
    </div>
  ),
};

// ============================================================================
// TEXT ICON
// ============================================================================

export const TextIcon: Story = {
  name: "Text Icon",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="text" color="primary" startIcon={<DeleteRounded />}>
        Primary
      </Button>

      <Button variant="text" color="secondary" endIcon={<SendRounded />}>
        Secondary
      </Button>
    </div>
  ),
};

// ============================================================================
// TEXT SIZES
// ============================================================================

export const TextSizes: Story = {
  name: "Text Sizes",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="text" color="primary" size="small">
        Small
      </Button>

      <Button variant="text" color="primary" size="medium">
        Medium
      </Button>

      <Button variant="text" color="primary" size="large">
        Large
      </Button>
    </div>
  ),
};

// ============================================================================
// ICON COLOR
// ============================================================================

export const IconColor: Story = {
  name: "Icon Color",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="text" color="primary" startIcon={<NotificationsRounded />} />

      <Button variant="text" color="secondary" startIcon={<NotificationsRounded />} />

      <Button variant="text" color="error" startIcon={<NotificationsRounded />} />

      <Button variant="text" color="warning" startIcon={<NotificationsRounded />} />

      <Button variant="text" color="success" startIcon={<NotificationsRounded />} />
    </div>
  ),
};

// ============================================================================
// ICON SIZES
// ============================================================================

export const IconSizes: Story = {
  name: "Icon Sizes",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="text" color="primary" startIcon={<NotificationsRounded />} size="small" />

      <Button variant="text" color="primary" startIcon={<NotificationsRounded />} size="medium" />

      <Button variant="text" color="primary" startIcon={<NotificationsRounded />} size="large" />
    </div>
  ),
};

// ============================================================================
// FAB
// ============================================================================

export const Fab: Story = {
  name: "FAB",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="fab" color="primary" />
    </div>
  ),
};

// ============================================================================
// FAB COLOR
// ============================================================================

export const FabColor: Story = {
  name: "FAB Color",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="fab" color="primary" />

      <Button variant="fab" color="secondary" />

      <Button variant="fab" color="error" />

      <Button variant="fab" color="warning" />

      <Button variant="fab" color="success" />
    </div>
  ),
};

// ============================================================================
// FAB SIZE
// ============================================================================

export const FabSize: Story = {
  name: "FAB Size",
  render: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <Button variant="fab" color="primary" size="small" />

      <Button variant="fab" color="primary" size="medium" />

      <Button variant="fab" color="primary" size="large" />
    </div>
  ),
};

// ============================================================================
// BUTTON GROUP
// ============================================================================

// export const ButtonGroup: Story = {
//   name: "Button Group",
//   render: () => (
//     <div
//       style={{
//         display: "flex",
//         alignItems: "center",
//         gap: 12,
//         flexWrap: "wrap",
//       }}
//     >
//       <Button variant="contained" color="primary">
//         One
//       </Button>
//       <Button variant="contained" color="primary">
//         Two
//       </Button>
//       <Button variant="contained" color="primary">
//         Three
//       </Button>
//     </div>
//   ),
// };