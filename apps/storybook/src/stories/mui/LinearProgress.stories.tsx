import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinearProgress, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/LinearProgress' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: 320 }}>
      <LinearProgress />
      <LinearProgress variant="determinate" value={45} />
      <LinearProgress color="secondary" variant="determinate" value={75} />
    </Stack>
  ),
};
