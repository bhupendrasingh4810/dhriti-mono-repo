import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppBar, Toolbar, Typography } from '@mui/material';

const meta: Meta = { title: 'MUI/AppBar' };
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <AppBar position="static" color="inherit">
      <Toolbar><Typography variant="h6">Top Bar</Typography></Toolbar>
    </AppBar>
  ),
};
