import type { Preview } from '@storybook/react-vite'
import { Box } from '@mui/material';
import { ThemeProvider, type DensityMode } from '@dhriti/ui';

const preview: Preview = {
  globalTypes: {
    mode: {
      name: 'Theme Mode',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: ['light', 'dark', 'system'],
      },
    },
    density: {
      name: 'Density',
      defaultValue: 'comfortable',
      toolbar: {
        icon: 'circlehollow',
        items: ['compact', 'comfortable', 'spacious'],
      },
    },
  },
  decorators: [
    (Story, context) => (
      <ThemeProvider
        mode={context.globals.mode}
        density={context.globals.density as DensityMode}
      >
        <Box sx={{ p: 2, bgcolor: 'background.default', minHeight: '100vh' }}>
          <Story />
        </Box>
      </ThemeProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },
    backgrounds: {
      disable: true,
    },
  },
};

export default preview;