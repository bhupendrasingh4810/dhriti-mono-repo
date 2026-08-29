import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircularProgress, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/CircularProgress' };
export default meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <CircularProgress />
      <CircularProgress color="secondary" />
      <CircularProgress variant="determinate" value={65} />
    </Stack>
  ),
};
