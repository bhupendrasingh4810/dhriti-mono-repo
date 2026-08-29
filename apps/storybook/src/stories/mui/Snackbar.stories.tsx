import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert, Snackbar } from '@mui/material';

const meta: Meta = { title: 'MUI/Snackbar' };
export default meta;
type Story = StoryObj;

export const Open: Story = {
  render: () => (
    <Snackbar open anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Alert severity="success" variant="filled">Saved successfully</Alert>
    </Snackbar>
  ),
};
