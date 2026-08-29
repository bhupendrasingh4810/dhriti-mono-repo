import type { Meta, StoryObj } from '@storybook/react-vite';
import AddIcon from '@mui/icons-material/Add';
import { Fab, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Fab' };
export default meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      <Fab color="primary" size="small"><AddIcon /></Fab>
      <Fab color="secondary"><AddIcon /></Fab>
      <Fab disabled><AddIcon /></Fab>
    </Stack>
  ),
};
