import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Typography } from '@mui/material';

const meta: Meta = { title: 'MUI/Typography' };
export default meta;
type Story = StoryObj;

export const Scale: Story = {
  render: () => (
    <Stack spacing={0.5}>
      <Typography variant="h1">H1</Typography>
      <Typography variant="h2">H2</Typography>
      <Typography variant="h3">H3</Typography>
      <Typography variant="body1">Body1</Typography>
      <Typography variant="body2">Body2</Typography>
      <Typography variant="caption">Caption</Typography>
    </Stack>
  ),
};
