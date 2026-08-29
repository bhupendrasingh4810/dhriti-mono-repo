import type { Meta, StoryObj } from '@storybook/react-vite';
import SettingsIcon from '@mui/icons-material/Settings';
import { IconButton, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/IconButton' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      <IconButton><SettingsIcon /></IconButton>
      <IconButton color="primary"><SettingsIcon /></IconButton>
      <IconButton disabled><SettingsIcon /></IconButton>
    </Stack>
  ),
};
