import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Link' };
export default meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => (
    <Stack spacing={1}>
      <Link href="#">Default link</Link>
      <Link href="#" underline="hover">Hover underline</Link>
    </Stack>
  ),
};
