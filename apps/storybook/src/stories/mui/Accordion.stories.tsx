import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';

const meta: Meta = { title: 'MUI/Accordion' };
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <>
      <Accordion defaultExpanded>
        <AccordionSummary>Expanded</AccordionSummary>
        <AccordionDetails><Typography variant="body2">Content</Typography></AccordionDetails>
      </Accordion>
      <Accordion disabled>
        <AccordionSummary>Disabled</AccordionSummary>
        <AccordionDetails>Disabled</AccordionDetails>
      </Accordion>
    </>
  ),
};
