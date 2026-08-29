import type { Meta, StoryObj } from '@storybook/react-vite';
import { Paper, Stack, Typography } from '@mui/material';

const meta: Meta = { title: 'MUI/Paper' };
export default meta;
type Story = StoryObj;

export const Elevation: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Paper sx={{ p: 2 }} elevation={0}><Typography>Flat</Typography></Paper>
      <Paper sx={{ p: 2 }} elevation={3}><Typography>Elevated</Typography></Paper>
    </Stack>
  ),
};
