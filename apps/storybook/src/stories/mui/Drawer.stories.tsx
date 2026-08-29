import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Drawer, Typography } from '@mui/material';

const meta: Meta = { title: 'MUI/Drawer' };
export default meta;
type Story = StoryObj;

export const Open: Story = {
  render: () => (
    <Drawer open variant="persistent">
      <Box sx={{ width: 280, p: 2 }}><Typography>Drawer Content</Typography></Box>
    </Drawer>
  ),
};
