import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'warm-ivory': '#FFF8EE',
        'marigold': '#F7C873',
        'gulabi-rose': '#F2A7B8',
        'royal-plum': '#3A2442',
      },
    },
  },
  plugins: [],
}
export default config
