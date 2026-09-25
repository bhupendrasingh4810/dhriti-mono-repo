import type { Preview } from "@storybook/react-vite";
import { ThemeProvider } from "../src/theme";

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider mode="light">
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: "centered",
    controls: { expanded: true },
  },
};

export default preview;
