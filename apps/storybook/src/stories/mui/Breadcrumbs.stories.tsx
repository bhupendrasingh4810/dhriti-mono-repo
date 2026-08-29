import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs, Link, Typography } from '@mui/material';

const meta: Meta = { title: 'MUI/Breadcrumbs' };
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Breadcrumbs>
      <Link href="#">Home</Link>
      <Link href="#">Projects</Link>
      <Typography color="text.primary">Atlas</Typography>
    </Breadcrumbs>
  ),
};
