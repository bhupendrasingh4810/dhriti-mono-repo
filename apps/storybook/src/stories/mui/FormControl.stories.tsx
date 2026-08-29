import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/FormControl' };
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: 220 }}>
      <FormControl>
        <InputLabel id="fc-label">Status</InputLabel>
        <Select labelId="fc-label" value="open" label="Status">
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
        </Select>
      </FormControl>
      <FormControl disabled>
        <InputLabel id="fc-label-2">Disabled</InputLabel>
        <Select labelId="fc-label-2" value="open" label="Disabled"><MenuItem value="open">Open</MenuItem></Select>
      </FormControl>
    </Stack>
  ),
};
