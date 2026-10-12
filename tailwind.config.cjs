/** @type {import('tailwindcss').Config} */
module.exports = {
  // Brand theme retained through Tailwind 4’s official @config bridge.
  theme: {
    extend: {
      colors: {
        ivory:          '#F8F5EF',
        sand:           '#E9E0D4',
        beige:          '#D6C5AE',
        'dark-brown':   '#4A392D',
        'medium-brown': '#6A5744',
        'light-brown':  '#A08070',
        gold:           '#C9A84C',
        'light-gold':   '#DBBF6E',
        'warm-white':   '#F8F5EF',
        'deep-brown':   '#2E1F13',
        'saudi-green':  '#4A7C59',
        'muted-green':  '#6B9E7A',
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
        sans:   ['Cairo', 'Tajawal', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpolygon points='40,0 80,40 40,80 0,40' stroke='%234A392D' stroke-width='0.5' stroke-opacity='0.10'/%3E%3Cpolygon points='40,14 66,40 40,66 14,40' stroke='%234A392D' stroke-width='0.3' stroke-opacity='0.06'/%3E%3C/g%3E%3C/svg%3E\")",
        'light-pattern': "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cpolygon points='40,0 80,40 40,80 0,40' stroke='%234A392D' stroke-width='0.5' stroke-opacity='0.05'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
        'spin-slow':  'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'brand':      '0 4px 24px rgba(74, 57, 45, 0.14)',
        'brand-lg':   '0 12px 48px rgba(74, 57, 45, 0.18)',
        // v3's shadow-gold color utility made this shadow opaque. Preserve it.
        'gold':       '0 4px 24px rgb(201, 168, 76)',
        'card':       '0 2px 20px rgba(74, 57, 45, 0.07)',
        'card-hover': '0 8px 40px rgba(74, 57, 45, 0.13)',
      },
    },
  },
  plugins: [],
}
