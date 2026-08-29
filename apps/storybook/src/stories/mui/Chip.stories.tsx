import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Chip' };
export default meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      <Chip label="Default" />
      <Chip label="Outlined" variant="outlined" />
      <Chip label="Primary" color="primary" />
      <Chip label="Disabled" disabled />
    </Stack>
  ),
};
