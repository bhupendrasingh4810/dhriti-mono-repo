import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Alert' };
export default meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => (
    <Stack spacing={1}>
      <Alert severity="info">Info</Alert>
      <Alert severity="success">Success</Alert>
      <Alert severity="warning">Warning</Alert>
      <Alert severity="error">Error</Alert>
    </Stack>
  ),
};
