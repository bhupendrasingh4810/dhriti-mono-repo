import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider, Stack, Typography } from '@mui/material';

const meta: Meta = { title: 'MUI/Divider' };
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Stack spacing={1}>
      <Typography>Above</Typography>
      <Divider />
      <Typography>Below</Typography>
    </Stack>
  ),
};
