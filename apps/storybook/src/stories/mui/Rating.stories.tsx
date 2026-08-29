import type { Meta, StoryObj } from '@storybook/react-vite';
import { Rating, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Rating' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <Stack spacing={1}>
      <Rating value={3} />
      <Rating value={4} precision={0.5} readOnly />
      <Rating disabled value={2} />
    </Stack>
  ),
};
