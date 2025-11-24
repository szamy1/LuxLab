import { ThemeConfig } from '../types/lighting';

export type ThemeId = 'light' | 'dark' | 'blueprint' | 'high-contrast';

export const themes: ThemeConfig[] = [
  {
    id: 'light',
    name: 'LuxLab Light',
    description: 'Clean light theme with neutral backgrounds and bold accent.'
  },
  {
    id: 'dark',
    name: 'LuxLab Dark',
    description: 'Deep greys to highlight heatmaps and charts.'
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    description: 'Technical drawing vibe with cyan highlights.'
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Accessibility-focused high-contrast palette.'
  }
];

export const defaultThemeId: ThemeId = 'light';
export const themeStorageKey = 'luxlab-theme';
