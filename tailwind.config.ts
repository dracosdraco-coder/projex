import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sf: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        // Semantic tokens mapped 1:1 to Apple HIG system colors (Color(.systemX) in SwiftUI).
        // Always reach for these instead of raw Tailwind palette colors (blue-600, purple-600, etc.)
        // so a future SwiftUI port is a token swap, not a redesign. See DESIGN.md.
        accent: {
          DEFAULT: '#007AFF', // systemBlue — primary actions only
          dark: '#0A84FF',    // systemBlue (dark mode variant)
        },
        success: {
          DEFAULT: '#34C759', // systemGreen — positive financial values, success states
          dark: '#30D158',
        },
        danger: {
          DEFAULT: '#FF3B30', // systemRed — negative financial values, destructive actions
          dark: '#FF453A',
        },
        warning: {
          DEFAULT: '#FF9500', // systemOrange — warnings, pending states
          dark: '#FF9F0A',
        },
        info: {
          DEFAULT: '#5856D6', // systemIndigo — informational accents (roles, badges) — use sparingly
          dark: '#5E5CE6',
        },
      },
      fontSize: {
        // Apple HIG type scale — name matches SwiftUI's Font.TextStyle so sizes port directly.
        'largetitle': ['34px', { lineHeight: '41px', fontWeight: '700' }],
        'title1': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'title2': ['22px', { lineHeight: '28px', fontWeight: '700' }],
        'title3': ['20px', { lineHeight: '25px', fontWeight: '600' }],
        'headline': ['17px', { lineHeight: '22px', fontWeight: '600' }],
        'body': ['17px', { lineHeight: '22px', fontWeight: '400' }],
        'callout': ['16px', { lineHeight: '21px', fontWeight: '400' }],
        'subheadline': ['15px', { lineHeight: '20px', fontWeight: '400' }],
        'footnote': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'caption1': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'caption2': ['11px', { lineHeight: '13px', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
}
export default config
