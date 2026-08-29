import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tab, Tabs } from '@mui/material';

const meta: Meta = { title: 'MUI/Tabs' };
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <Tabs value={1}><Tab label="Overview" /><Tab label="Activity" /><Tab label="Files" /></Tabs>,
};
