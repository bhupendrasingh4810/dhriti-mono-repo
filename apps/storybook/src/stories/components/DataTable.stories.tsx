import type { Meta, StoryObj } from '@storybook/react-vite';
import { UIDataTable } from '@dhriti/ui';

const meta: Meta = { title: 'Components/DataTable' };
export default meta;
type Story = StoryObj;

const rows = [
  { id: 1, name: 'Task A', status: 'In Progress' },
  { id: 2, name: 'Task B', status: 'Done' },
  { id: 3, name: 'Task C', status: 'Todo' },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
];

export const Default: Story = {
  render: () => <UIDataTable title="Tasks" rows={rows} columns={columns} />,
};
