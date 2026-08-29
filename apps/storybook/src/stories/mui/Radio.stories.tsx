import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormControlLabel, Radio, RadioGroup, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Radio' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <Stack spacing={2}>
      <RadioGroup defaultValue="a">
        <FormControlLabel value="a" control={<Radio />} label="Option A" />
        <FormControlLabel value="b" control={<Radio />} label="Option B" />
      </RadioGroup>
      <FormControlLabel control={<Radio disabled />} label="Disabled" />
    </Stack>
  ),
};
