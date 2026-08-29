import type { Meta, StoryObj } from '@storybook/react-vite';
import AddIcon from '@mui/icons-material/Add';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import SaveIcon from '@mui/icons-material/Save';
import { Box, SpeedDial, SpeedDialAction } from '@mui/material';

const meta: Meta = { title: 'MUI/SpeedDial' };
export default meta;
type Story = StoryObj;

export const Open: Story = {
  render: () => (
    <Box sx={{ height: 240, position: 'relative' }}>
      <SpeedDial ariaLabel="quick actions" icon={<AddIcon />} open sx={{ position: 'absolute', bottom: 16, right: 16 }}>
        <SpeedDialAction icon={<FileCopyIcon />} tooltipTitle="Copy" />
        <SpeedDialAction icon={<SaveIcon />} tooltipTitle="Save" />
      </SpeedDial>
    </Box>
  ),
};
