import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Avatar' };
export default meta;
type Story = StoryObj;

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      <Avatar sx={{ width: 24, height: 24 }}>A</Avatar>
      <Avatar>B</Avatar>
      <Avatar sx={{ width: 56, height: 56 }}>C</Avatar>
    </Stack>
  ),
};
