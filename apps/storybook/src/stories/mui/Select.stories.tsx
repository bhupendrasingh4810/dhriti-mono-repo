import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Select' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <Stack spacing={2} sx={{ width: 220 }}>
      <FormControl>
        <InputLabel id="select-default">Status</InputLabel>
        <Select labelId="select-default" value="todo" label="Status">
          <MenuItem value="todo">Todo</MenuItem>
          <MenuItem value="done">Done</MenuItem>
        </Select>
      </FormControl>
      <FormControl disabled>
        <InputLabel id="select-disabled">Disabled</InputLabel>
        <Select labelId="select-disabled" value="todo" label="Disabled"><MenuItem value="todo">Todo</MenuItem></Select>
      </FormControl>
    </Stack>
  ),
};
