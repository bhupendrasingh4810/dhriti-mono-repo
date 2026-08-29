import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Tooltip } from '@mui/material';

const meta: Meta = { title: 'MUI/Tooltip' };
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <Tooltip title="Helpful hint"><Button>Hover me</Button></Tooltip>,
};
