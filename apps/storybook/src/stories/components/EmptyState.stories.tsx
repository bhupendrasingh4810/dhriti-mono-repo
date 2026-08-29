import type { Meta, StoryObj } from '@storybook/react-vite';
import { UIEmptyState, UIButton } from '@dhriti/ui';

const meta: Meta = { title: 'Components/EmptyState' };
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <UIEmptyState
      title="No records"
      description="Create your first item to get started."
      action={<UIButton size="small">Create Item</UIButton>}
    />
  ),
};
