/**
 * Avatar Component Stories
 * 
 * Comprehensive Storybook documentation for Dhriti Avatar component.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarGroupCustom } from "../src/components/mui";
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Star as StarIcon,
} from "@mui/icons-material";

const meta = {
  title: "Components/Avatar",
  component: Avatar,

  parameters: {
    layout: "centered",
  },

  args: {
    children: "JD",
    size: "md",
    variant: "circular",
  },

  argTypes: {
    children: {
      control: "text",
    },
    src: {
      control: "text",
    },
    alt: {
      control: "text",
    },
    variant: {
      control: "select",
      options: ["circular", "rounded", "square"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    color: {
      control: "color",
    },
    withBadge: {
      control: "boolean",
    },
    online: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

// ============================================================================
// IMAGE AVATARS
// ============================================================================

/**
 * Avatar with image.
 */
export const ImageAvatar: Story = {
  name: "Image Avatar",
  args: {
    src: "https://i.pravatar.cc/150?img=12",
    alt: "John Doe",
    size: "md",
  },
};

/**
 * Image avatar with fallback.
 */
export const ImageWithFallback: Story = {
  name: "Image with Fallback",
  args: {
    src: "invalid-url.jpg",
    alt: "Invalid image",
    children: "JD",
  },
};

/**
 * Image avatars with different people.
 */
export const ImageAvatars: Story = {
  name: "Multiple Image Avatars",
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      <Avatar src="https://i.pravatar.cc/150?img=1" alt="User 1" />
      <Avatar src="https://i.pravatar.cc/150?img=2" alt="User 2" />
      <Avatar src="https://i.pravatar.cc/150?img=3" alt="User 3" />
      <Avatar src="https://i.pravatar.cc/150?img=4" alt="User 4" />
      <Avatar src="https://i.pravatar.cc/150?img=5" alt="User 5" />
    </div>
  ),
};

// ============================================================================
// LETTER AVATARS
// ============================================================================

export const LetterAvatars: Story = {
  name: "Multiple Letter Avatars",
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      <Avatar>JD</Avatar>
      <Avatar>AS</Avatar>
      <Avatar>MK</Avatar>
      <Avatar>RJ</Avatar>
      <Avatar>TP</Avatar>
    </div>
  ),
};

/**
 * Letter avatars with custom colors.
 */
export const LetterWithColors: Story = {
  name: "Letter with Colors",
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      <Avatar color="#1976D2">B</Avatar>
      <Avatar color="#10B981">G</Avatar>
      <Avatar color="#F59E0B">O</Avatar>
      <Avatar color="#EF4444">R</Avatar>
      <Avatar color="#8B5CF6">P</Avatar>
    </div>
  ),
};

// ============================================================================
// ICON AVATARS
// ============================================================================

/**
 * Avatar with icon.
 */
export const IconAvatar: Story = {
  name: "Icon Avatar",
  args: {
    children: <PersonIcon />,
  },
};

/**
 * Avatar with business icon.
 */
export const IconAvatarBusiness: Story = {
  name: "Icon Avatar (Business)",
  args: {
    children: <BusinessIcon />,
    color: "#7C8394",
  },
};

/**
 * Multiple icon avatars.
 */
export const IconAvatars: Story = {
  name: "Multiple Icon Avatars",
  render: () => (
    <div style={{ display: "flex", gap: 16 }}>
      <Avatar>
        <PersonIcon />
      </Avatar>
      <Avatar>
        <BusinessIcon />
      </Avatar>
      <Avatar>
        <StarIcon />
      </Avatar>
    </div>
  ),
};

// ============================================================================
// VARIANT
// ============================================================================

export const Variants: Story = {
  name: "Variants",
  render: () => (
    <div style={{ display: "flex", gap: 24 }}>
      <Avatar variant="circular">C</Avatar>
      <Avatar variant="rounded">R</Avatar>
      <Avatar variant="square">S</Avatar>
    </div>
  ),
};

// ============================================================================
// GROUPED
// ============================================================================

/**
 * Grouped avatars.
 */
// export const Grouped: Story = {
//   name: "Grouped",
//   render: () => (
//     <AvatarGroupCustom max={4}>
//       <Avatar src="https://i.pravatar.cc/150?img=1" />
//       <Avatar src="https://i.pravatar.cc/150?img=2" />
//       <Avatar src="https://i.pravatar.cc/150?img=3" />
//       <Avatar src="https://i.pravatar.cc/150?img=4" />
//       <Avatar src="https://i.pravatar.cc/150?img=5" />
//     </AvatarGroupCustom>
//   ),
// };

// /**
//  * Grouped with letter avatars.
//  */
// export const GroupedLetters: Story = {
//   name: "Grouped (Letters)",
//   render: () => (
//     <AvatarGroupCustom max={3}>
//       <Avatar>JD</Avatar>
//       <Avatar>AS</Avatar>
//       <Avatar>MK</Avatar>
//       <Avatar>RJ</Avatar>
//       <Avatar>TP</Avatar>
//     </AvatarGroupCustom>
//   ),
// };

// ============================================================================
// GROUPED SIZE
// ============================================================================

/**
 * Small grouped avatars.
 */
// export const GroupedSizeSmall: Story = {
//   name: "Small",
//   render: () => (
//     <AvatarGroupCustom max={3} size="sm">
//       <Avatar src="https://i.pravatar.cc/150?img=1" />
//       <Avatar src="https://i.pravatar.cc/150?img=2" />
//       <Avatar src="https://i.pravatar.cc/150?img=3" />
//       <Avatar src="https://i.pravatar.cc/150?img=4" />
//     </AvatarGroupCustom>
//   ),
// };

// /**
//  * Medium grouped avatars.
//  */
// export const GroupedSizeMedium: Story = {
//   name: "Medium",
//   render: () => (
//     <AvatarGroupCustom max={3} size="md">
//       <Avatar src="https://i.pravatar.cc/150?img=1" />
//       <Avatar src="https://i.pravatar.cc/150?img=2" />
//       <Avatar src="https://i.pravatar.cc/150?img=3" />
//       <Avatar src="https://i.pravatar.cc/150?img=4" />
//     </AvatarGroupCustom>
//   ),
// };

// /**
//  * Large grouped avatars.
//  */
// export const GroupedSizeLarge: Story = {
//   name: "Large",
//   render: () => (
//     <AvatarGroupCustom max={3} size="lg">
//       <Avatar src="https://i.pravatar.cc/150?img=1" />
//       <Avatar src="https://i.pravatar.cc/150?img=2" />
//       <Avatar src="https://i.pravatar.cc/150?img=3" />
//       <Avatar src="https://i.pravatar.cc/150?img=4" />
//     </AvatarGroupCustom>
//   ),
// };

// /**
//  * All grouped sizes.
//  */
// export const GroupedSizeAll: Story = {
//   name: "All Grouped Sizes",
//   render: () => (
//     <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
//       <AvatarGroupCustom max={3} size="sm">
//         <Avatar src="https://i.pravatar.cc/150?img=1" />
//         <Avatar src="https://i.pravatar.cc/150?img=2" />
//         <Avatar src="https://i.pravatar.cc/150?img=3" />
//         <Avatar src="https://i.pravatar.cc/150?img=4" />
//       </AvatarGroupCustom>

//       <AvatarGroupCustom max={3} size="md">
//         <Avatar src="https://i.pravatar.cc/150?img=1" />
//         <Avatar src="https://i.pravatar.cc/150?img=2" />
//         <Avatar src="https://i.pravatar.cc/150?img=3" />
//         <Avatar src="https://i.pravatar.cc/150?img=4" />
//       </AvatarGroupCustom>

//       <AvatarGroupCustom max={3} size="lg">
//         <Avatar src="https://i.pravatar.cc/150?img=1" />
//         <Avatar src="https://i.pravatar.cc/150?img=2" />
//         <Avatar src="https://i.pravatar.cc/150?img=3" />
//         <Avatar src="https://i.pravatar.cc/150?img=4" />
//       </AvatarGroupCustom>
//     </div>
//   ),
// };

// ============================================================================
// WITH BADGE
// ============================================================================

export const WithBadgeAll: Story = {
  name: "All Badge Types",
  render: () => (
    <div style={{ display: "flex", gap: 24 }}>
      <Avatar src="https://i.pravatar.cc/150?img=1" online />
      <Avatar src="https://i.pravatar.cc/150?img=2" withBadge badgeContent="3" />
      <Avatar src="https://i.pravatar.cc/150?img=3" withBadge badgeContent="!" badgeColor="error" />
      <Avatar src="https://i.pravatar.cc/150?img=4" withBadge badgeContent="99+" />
    </div>
  ),
};

// ============================================================================
// SIZES
// ============================================================================

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <Avatar size="xs">XS</Avatar>
      <Avatar size="sm">SM</Avatar>
      <Avatar size="md">MD</Avatar>
      <Avatar size="lg">LG</Avatar>
      <Avatar size="xl">XL</Avatar>
    </div>
  ),
};

export const SizesWithImages: Story = {
  name: "Sizes with Images",
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <Avatar size="xs" src="https://i.pravatar.cc/150?img=1" />
      <Avatar size="sm" src="https://i.pravatar.cc/150?img=2" />
      <Avatar size="md" src="https://i.pravatar.cc/150?img=3" />
      <Avatar size="lg" src="https://i.pravatar.cc/150?img=4" />
      <Avatar size="xl" src="https://i.pravatar.cc/150?img=5" />
    </div>
  ),
};