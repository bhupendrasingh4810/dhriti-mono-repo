import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

const meta: Meta = { title: 'MUI/Dialog' };
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Dialog open>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogContent>Dialog content</DialogContent>
      <DialogActions><Button>Cancel</Button><Button variant="contained">Save</Button></DialogActions>
    </Dialog>
  ),
};
