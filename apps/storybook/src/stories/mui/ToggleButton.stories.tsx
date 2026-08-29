import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

const meta: Meta = { title: 'MUI/ToggleButton' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <ToggleButtonGroup value="table" exclusive>
      <ToggleButton value="table">Table</ToggleButton>
      <ToggleButton value="board">Board</ToggleButton>
      <ToggleButton value="calendar" disabled>Calendar</ToggleButton>
    </ToggleButtonGroup>
  ),
};
