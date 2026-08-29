import type { Meta, StoryObj } from '@storybook/react-vite';
import { Autocomplete, Stack, TextField } from '@mui/material';

const meta: Meta = { title: 'MUI/Autocomplete' };
export default meta;
type Story = StoryObj;

const options = ['Alpha', 'Beta', 'Gamma'];

export const States: Story = {
  render: () => (
    <Stack spacing={2} sx={{ maxWidth: 320 }}>
      <Autocomplete options={options} renderInput={(params) => <TextField {...params} label="Default" />} />
      <Autocomplete disabled options={options} renderInput={(params) => <TextField {...params} label="Disabled" />} />
    </Stack>
  ),
};
