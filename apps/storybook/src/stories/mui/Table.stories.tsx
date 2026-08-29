import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const meta: Meta = { title: 'MUI/Table' };
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Table size="small">
      <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
      <TableBody>
        <TableRow hover><TableCell>Task A</TableCell><TableCell>In Progress</TableCell></TableRow>
        <TableRow selected><TableCell>Task B</TableCell><TableCell>Done</TableCell></TableRow>
      </TableBody>
    </Table>
  ),
};
