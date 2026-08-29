import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Input' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 280 }}>
      <Input defaultValue="Default" />
      <Input placeholder="Placeholder" />
      <Input disabled value="Disabled" />
      <Input error value="Error" />
    </Stack>
  ),
};
