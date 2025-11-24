import type { Config } from 'tailwindcss';

const withOpacity = (variable: string) => ({
  DEFAULT: `rgb(var(${variable}) / <alpha-value>)`
});

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: withOpacity('--color-background'),
        'background-elevated': withOpacity('--color-background-elevated'),
        surface: withOpacity('--color-surface'),
        'surface-muted': withOpacity('--color-surface-muted'),
        accent: withOpacity('--color-accent'),
        'accent-soft': withOpacity('--color-accent-soft'),
        'accent-strong': withOpacity('--color-accent-strong'),
        'border-subtle': withOpacity('--color-border-subtle'),
        'border-strong': withOpacity('--color-border-strong'),
        'text-main': withOpacity('--color-text-main'),
        'text-muted': withOpacity('--color-text-muted'),
        'text-inverted': withOpacity('--color-text-inverted'),
        danger: withOpacity('--color-danger'),
        warning: withOpacity('--color-warning'),
        success: withOpacity('--color-success')
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)'
      },
      spacing: {
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)'
      },
      fontFamily: {
        sans: 'var(--font-family-base)'
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: ['var(--font-size-md)', { lineHeight: 'var(--line-height-base)' }],
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)'
      }
    }
  },
  plugins: []
};

export default config;
