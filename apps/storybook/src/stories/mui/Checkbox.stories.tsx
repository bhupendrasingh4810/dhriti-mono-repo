import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, FormControlLabel, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Checkbox' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <Stack>
      <FormControlLabel control={<Checkbox defaultChecked />} label="Checked" />
      <FormControlLabel control={<Checkbox />} label="Unchecked" />
      <FormControlLabel control={<Checkbox disabled />} label="Disabled" />
    </Stack>
  ),
};
