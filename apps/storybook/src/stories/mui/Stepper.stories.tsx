import type { Meta, StoryObj } from '@storybook/react-vite';
import { Step, StepLabel, Stepper } from '@mui/material';

const meta: Meta = { title: 'MUI/Stepper' };
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Stepper activeStep={1}>
      <Step><StepLabel>Plan</StepLabel></Step>
      <Step><StepLabel>Build</StepLabel></Step>
      <Step><StepLabel>Ship</StepLabel></Step>
    </Stepper>
  ),
};
