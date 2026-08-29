import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Slider' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: 280 }}>
      <Slider defaultValue={35} />
      <Slider defaultValue={60} color="secondary" />
      <Slider defaultValue={20} disabled />
    </Stack>
  ),
};
