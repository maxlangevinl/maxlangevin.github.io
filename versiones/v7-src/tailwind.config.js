/** Estudio: gesso claro, tinta y un rojo de tubo de óleo (cadmio). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gesso: '#ebe8e1', paper: '#f5f3ee', ink: '#141210', smoke: '#6a645b', line: 'rgba(20,18,16,.14)',
        cadmio: '#c4321d', umber: '#3b2a1c',
      },
      fontFamily: {
        display: ['Gloock', 'Georgia', 'serif'],
        sans: ['Figtree', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"Fragment Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      letterSpacing: { tightest: '-.035em' },
    },
  },
  plugins: [],
};
