import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormControlLabel, Stack, Switch } from '@mui/material';

const meta: Meta = { title: 'MUI/Switch' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <Stack>
      <FormControlLabel control={<Switch defaultChecked />} label="Enabled" />
      <FormControlLabel control={<Switch />} label="Off" />
      <FormControlLabel control={<Switch disabled />} label="Disabled" />
    </Stack>
  ),
};
