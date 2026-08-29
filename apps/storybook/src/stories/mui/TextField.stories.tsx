import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, TextField } from '@mui/material';

const meta: Meta = { title: 'MUI/TextField' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 320 }}>
      <TextField label="Default" />
      <TextField label="Error" error helperText="Required" />
      <TextField label="Disabled" disabled value="Disabled" />
      <TextField label="Small" size="small" />
    </Stack>
  ),
};
