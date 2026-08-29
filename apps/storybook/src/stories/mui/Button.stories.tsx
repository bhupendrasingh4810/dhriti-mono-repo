import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, CircularProgress, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Button' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      <Button variant="contained">Default</Button>
      <Button variant="outlined">Outlined</Button>
      <Button disabled>Disabled</Button>
      <Button startIcon={<CircularProgress size={14} color="inherit" />}>Loading</Button>
    </Stack>
  ),
};
