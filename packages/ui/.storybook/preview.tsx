import type { Preview } from "@storybook/react-vite";
import { INITIAL_VIEWPORTS } from "storybook/viewport";
import { ThemeProvider } from "../src/theme";
import "./preview.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Dhriti theme",
      toolbar: { icon: "circlehollow", items: ["light", "dark"] },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, context) => (
      <ThemeProvider mode={context.globals.theme === "dark" ? "dark" : "light"}>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    viewport: { options: INITIAL_VIEWPORTS },
  },
};

export default preview;
