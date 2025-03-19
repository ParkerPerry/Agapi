import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/experimental-addon-test"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {
      "builder": {
        "viteConfigPath": "vite.config.ts"
      }
    }
  },
  core: {
    disableTelemetry: true,
  },
  viteFinal: async (config) => {
    // Ensure Storybook is accessible in Replit
    config.server = {
      host: '0.0.0.0',
      port: 6006,
      hmr: {
        port: 6006
      }
    };
    return config;
  }
};
export default config;