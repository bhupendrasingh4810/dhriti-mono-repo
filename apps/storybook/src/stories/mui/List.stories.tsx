import type { Meta, StoryObj } from '@storybook/react-vite';
import { List, ListItem, ListItemButton, ListItemText } from '@mui/material';

const meta: Meta = { title: 'MUI/List' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <List>
      <ListItem disablePadding><ListItemButton selected><ListItemText primary="Selected" /></ListItemButton></ListItem>
      <ListItem disablePadding><ListItemButton><ListItemText primary="Default" /></ListItemButton></ListItem>
      <ListItem disablePadding><ListItemButton disabled><ListItemText primary="Disabled" /></ListItemButton></ListItem>
    </List>
  ),
};
