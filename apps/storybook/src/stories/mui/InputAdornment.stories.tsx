import type { Meta, StoryObj } from '@storybook/react-vite';
import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment, TextField } from '@mui/material';

const meta: Meta = { title: 'MUI/InputAdornment' };
export default meta;
type Story = StoryObj;

export const StartAdornment: Story = {
  render: () => (
    <TextField
      label="Search"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
        ),
      }}
    />
  ),
};
