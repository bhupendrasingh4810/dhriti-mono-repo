import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Pagination' };
export default meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => (
    <Stack spacing={1}>
      <Pagination count={10} page={1} />
      <Pagination count={10} page={3} color="primary" />
      <Pagination count={10} page={5} disabled />
    </Stack>
  ),
};
