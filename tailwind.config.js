/** @type {import('tailwindcss').Config} */
export default {
  // utilities are generated only for the electronics archive and only apply inside it
  content: ['./src/electronics/**/*.{ts,tsx}'],
  important: '.elec-app',
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        ink: '#090A0C',
        ink2: '#111316',
        graphite: '#1D2024',
        steel: '#2A2D32',
        silver: '#C4C6C8',
        paper: '#E8E8E6',
        mute: '#92969C',
        frost: '#A9B8C6',
        placeholder: '#D9A35B',
      },
      fontFamily: {
        sans: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        inout: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [],
}
