import type { Meta, StoryObj } from '@storybook/react-vite';
import MailIcon from '@mui/icons-material/Mail';
import { Badge, Stack } from '@mui/material';

const meta: Meta = { title: 'MUI/Badge' };
export default meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => (
    <Stack direction="row" spacing={3}>
      <Badge badgeContent={4} color="primary"><MailIcon /></Badge>
      <Badge badgeContent={99} color="error"><MailIcon /></Badge>
    </Stack>
  ),
};
