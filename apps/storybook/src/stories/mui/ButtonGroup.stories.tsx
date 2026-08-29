import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ButtonGroup } from '@mui/material';

const meta: Meta = { title: 'MUI/ButtonGroup' };
export default meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => (
    <ButtonGroup>
      <Button>Left</Button>
      <Button>Center</Button>
      <Button>Right</Button>
    </ButtonGroup>
  ),
};
