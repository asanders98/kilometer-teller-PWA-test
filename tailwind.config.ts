import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: ({ opacityValue }: { opacityValue?: string }) =>
          opacityValue !== undefined ? `rgba(30,157,241,${opacityValue})` : '#1e9df1',
        'primary-foreground': 'var(--primary-foreground)',
        destructive: ({ opacityValue }: { opacityValue?: string }) =>
          opacityValue !== undefined ? `rgba(244,33,46,${opacityValue})` : '#f4212e',
        'destructive-foreground': 'var(--destructive-foreground)',
        success: ({ opacityValue }: { opacityValue?: string }) =>
          opacityValue !== undefined ? `rgba(34,197,94,${opacityValue})` : '#22c55e',
        warning: ({ opacityValue }: { opacityValue?: string }) =>
          opacityValue !== undefined ? `rgba(251,191,36,${opacityValue})` : '#fbbf24',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 0.25rem)',
        sm: 'calc(var(--radius) - 0.5rem)',
        xl: 'calc(var(--radius) + 0.25rem)',
        '2xl': 'calc(var(--radius) + 0.5rem)',
      },
      fontFamily: {
        sans: ['"Open Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
