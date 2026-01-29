/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Medieval Premium palette - Elegante e Sofisticado
        background: {
          DEFAULT: '#0f0d0b',    // obsidiana
          lighter: '#1a1612',
        },
        surface: {
          DEFAULT: '#252019',     // carvalho escuro
          lighter: '#2d271f',
          darker: '#1a1612',
          hover: '#352e24',
        },
        primary: {
          DEFAULT: '#c9a227',     // ouro antigo
          light: '#dbb84a',       // ouro claro
          dark: '#a68820',        // ouro escuro
          glow: 'rgba(201, 162, 39, 0.2)',
        },
        accent: {
          DEFAULT: '#722f37',     // vinho real
          light: '#8b3d47',       // vinho claro
          dark: '#5a252c',        // vinho escuro
          glow: 'rgba(114, 47, 55, 0.2)',
        },
        success: {
          DEFAULT: '#2d6a4f',     // esmeralda
          light: '#3d8b68',       // esmeralda claro
          dark: '#1e4a37',        // esmeralda escuro
          glow: 'rgba(45, 106, 79, 0.2)',
        },
        warning: {
          DEFAULT: '#c77c0e',     // âmbar
          light: '#e09520',       // âmbar claro
          dark: '#a56609',        // âmbar escuro
          glow: 'rgba(199, 124, 14, 0.2)',
        },
        error: {
          DEFAULT: '#9b2335',     // rubi
          light: '#b52e42',       // rubi claro
          dark: '#7a1c2a',        // rubi escuro
          glow: 'rgba(155, 35, 53, 0.2)',
        },
        text: {
          DEFAULT: '#e8dcc4',     // pergaminho
          secondary: '#b5a68a',   // pergaminho envelhecido
          muted: '#948672',       // pergaminho escuro (Ajustado para WCAG AA)
        },
        border: {
          DEFAULT: '#4a4035',     // ferro forjado
          light: '#5d5245',       // ferro claro
        },
        // Cores extras medievais
        bronze: {
          DEFAULT: '#cd7f32',
          light: '#dda15e',
          dark: '#a86523',
        },
        iron: {
          DEFAULT: '#4a4035',
          light: '#5d5245',
          dark: '#3a3228',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],           // Títulos majestosos (AEON, headers)
        heading: ['Inter', 'system-ui', 'sans-serif'], // Subtítulos e labels
        body: ['Inter', 'system-ui', 'sans-serif'],    // Corpo de texto, UI
        mono: ['"JetBrains Mono"', 'monospace'],       // Timer, código
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.0125em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.0125em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.0375em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.05em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
        'hero': ['6.4rem', { lineHeight: '1', letterSpacing: '-0.05em' }], // Timer hero
        'timer-sm': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }],
        'timer-md': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }],
        'timer-lg': ['6rem', { lineHeight: '1', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.25)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.3)',
        'hard': '0 8px 32px rgba(0, 0, 0, 0.4)',

        // Torch/candlelight shadows (warm glows)
        'torch-sm': '0 0 12px rgba(201, 162, 39, 0.15)',
        'torch': '0 0 20px rgba(201, 162, 39, 0.25)',
        'torch-lg': '0 0 30px rgba(201, 162, 39, 0.35)',
        'torch-primary': '0 0 24px rgba(201, 162, 39, 0.35), 0 0 48px rgba(201, 162, 39, 0.15)',
        'torch-accent': '0 0 24px rgba(114, 47, 55, 0.35), 0 0 48px rgba(114, 47, 55, 0.15)',
        'torch-success': '0 0 24px rgba(45, 106, 79, 0.35), 0 0 48px rgba(45, 106, 79, 0.15)',
        'torch-warning': '0 0 24px rgba(199, 124, 14, 0.35), 0 0 48px rgba(199, 124, 14, 0.15)',
        'torch-error': '0 0 24px rgba(155, 35, 53, 0.35), 0 0 48px rgba(155, 35, 53, 0.15)',

        // Elevation shadows
        'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.3)',
        'elevation-2': '0 3px 6px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.2)',
        'elevation-3': '0 10px 20px rgba(0, 0, 0, 0.25), 0 3px 6px rgba(0, 0, 0, 0.15)',

        // Inner glow variants
        'inner-torch-primary': 'inset 0 0 30px rgba(201, 162, 39, 0.2), inset 0 0 10px rgba(201, 162, 39, 0.3)',
        'inner-torch-accent': 'inset 0 0 30px rgba(114, 47, 55, 0.2), inset 0 0 10px rgba(114, 47, 55, 0.3)',
      },
      borderRadius: {
        'none': '0',
        'sm': '3px',
        'DEFAULT': '6px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      },
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'auto': 'auto',
      },
      transitionDuration: {
        'fastest': '100ms',
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '500ms',
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'normal': '0em',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
        'medieval': '0.15em', // Headers uppercase
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in-up': 'slideInUp 300ms ease-out',
        'slide-in-down': 'slideInDown 200ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'torch-flicker': 'torchFlicker 4s ease-in-out infinite',
        'gold-shimmer': 'goldShimmer 3s ease infinite',
        'parchment-unfold': 'parchmentUnfold 400ms ease-out',
        'seal-stamp': 'sealStamp 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideInUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInDown: {
          'from': { opacity: '0', transform: 'translateY(-20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        torchFlicker: {
          // Otimizado: usando apenas opacity (GPU-accelerated) em vez de filter:brightness
          // filter causa repaint completo e não é composited
          '0%, 100%': { opacity: '1' },
          '25%': { opacity: '0.93' },
          '50%': { opacity: '1' },
          '75%': { opacity: '0.95' },
        },
        goldShimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        parchmentUnfold: {
          'from': { opacity: '0', transform: 'scaleY(0.8) translateY(-10px)' },
          'to': { opacity: '1', transform: 'scaleY(1) translateY(0)' },
        },
        sealStamp: {
          'from': { transform: 'scale(1.3)', opacity: '0' },
          'to': { transform: 'scale(1)', opacity: '1' },
        },
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}
