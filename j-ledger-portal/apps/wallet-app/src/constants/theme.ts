/**
 * Single source of truth for the app's color palette.
 * These values are used in both tailwind.config.js and directly in components.
 */

export const Palette = {
  primary: {
    DEFAULT: '#f48fb1',
    container: '#f8bbd0',
    on: '#560027',
  },
  secondary: {
    DEFAULT: '#4855a5',
    container: '#c9cfff',
  },
  tertiary: {
    DEFAULT: '#73544b',
    container: '#f8cec2',
  },
  background: '#f5f6fc',
  surface: {
    DEFAULT: '#f5f6fc',
    container: {
      lowest: '#ffffff',
      low: '#eff0f7',
      DEFAULT: '#e6e8ef',
      high: '#e0e2ea',
      highest: '#dadde5',
    },
  },
  outline: {
    variant: 'rgba(171, 173, 179, 0.15)',
  },
  text: {
    primary: '#2c2f33',
    secondary: '#595b61',
    muted: '#9ca3af',
    error: '#ef4444',
  },
};

export const Theme = {
  colors: Palette,
  // Add spacing, radii, etc. here if needed
};
