import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardActions, CardContent, CardHeader, Typography, Button } from '@mui/material';

const meta: Meta = { title: 'MUI/Card' };
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader title="Card Title" subheader="Subtitle" />
      <CardContent><Typography variant="body2">Body content</Typography></CardContent>
      <CardActions><Button size="small">Action</Button></CardActions>
    </Card>
  ),
};
