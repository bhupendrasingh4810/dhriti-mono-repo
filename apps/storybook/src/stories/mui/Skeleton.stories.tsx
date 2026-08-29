import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Skeleton' };
export default meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => (
    <Stack spacing={1}>
      <Skeleton variant="text" width={220} />
      <Skeleton variant="rectangular" width={220} height={80} />
      <Skeleton variant="rounded" width={220} height={40} />
    </Stack>
  ),
};
