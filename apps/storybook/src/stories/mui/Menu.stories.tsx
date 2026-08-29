import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu, MenuItem } from '@mui/material';

const meta: Meta = { title: 'MUI/Menu' };
export default meta;
type Story = StoryObj;

export const Open: Story = {
  render: () => (
    <Menu
      open
      anchorReference="anchorPosition"
      anchorPosition={{ top: 120, left: 240 }}
    >
      <MenuItem selected>Selected item</MenuItem>
      <MenuItem>Default item</MenuItem>
      <MenuItem disabled>Disabled item</MenuItem>
    </Menu>
  ),
};
