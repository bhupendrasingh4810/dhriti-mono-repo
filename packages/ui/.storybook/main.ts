import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/postcss";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: "@storybook/react-vite",
  viteFinal: (config) => ({
    ...config,
    css: { ...config.css, postcss: { plugins: [tailwindcss()] } },
  }),
};

export default config;
