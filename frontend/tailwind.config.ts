import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom Color Palette - references CSS variables
      colors: {
        // Darker text colours
        'pink-body': 'var(--pink-body)',
        'blue-body': 'var(--blue-body)',
        'dark': 'var(--dark)',

        // Medium text colours
        'blue-lines': 'var(--blue-lines)',
        'medium-rose': 'var(--medium-rose)',
        
        // solid bright colours
        'item': 'var(--item)',
        'bubbles': 'var(--bubbles)',
        'hotpinku': 'var(--hotpinku)',
        'lime': 'var(--lime)',
        'blueberry': 'var(--blueberry)',
        'lemon': 'var(--lemon)',
        'plum': 'var(--plum)',
        'purple-body': 'var(--purple-body)',
        'persimmon': 'var(--persimmon)',
        'orang': 'var(--orang)',

        // effect (shadow, glow) colours
        'shadow': 'var(--shadow)',
        'notebook-outline': 'var(--notebook-outline)',
        'glow-pinku': 'var(--glow-pinku)',
      },

      // Custom Gradient Backgrounds - references CSS variables
      backgroundImage: {
        'gradient-violets': 'var(--gradient-violets)',
        'gradient-darkpinku': 'var(--gradient-darkpinku)',
        'gradient-fizz': 'var(--gradient-fizz)',
        'gradient-soda': 'var(--gradient-soda)',
        'gradient-rosette': 'var(--gradient-rosette)',
        'gradient-gem': 'var(--gradient-gem)',
        'gradient-gem-dark': 'var(--gradient-gem-dark)',
        'gradient-page': 'var(--gradient-page)',
        'gradient-kitty-main': 'var(--gradient-kitty-main)',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-success': 'var(--gradient-success)',
        'peach-gradient': 'var(--gradient-peach)',
        'gradient-goldy': 'var(--gradient-goldy)',
        'gradient-cool-blue': 'var(--gradient-cool-blue)',
      },

      // Font Families
      fontFamily: {
        'urbanist': ['Urbanist', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'bingbong': ['Bingbong', 'cursive'],
        'chewie': ['Chewie', 'display'],
        'magical-snow': ['MagicalSnow', 'display'],
        'snow-doodle': ['SnowDoodle', 'display'],
        'viucobacoba': ['ViuCobacoba', 'display'],
        'sans': ['Urbanist', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'sans-serif'],
        'handwriting': ['MagicalSnow', 'cursive'],
      },

      // Box Shadows - references CSS variables
      boxShadow: {
        'glow-pink': 'var(--shadow-glow-pink)',
        'glow-blue': 'var(--shadow-glow-blue)',
        'glow-purple': 'var(--shadow-glow-purple)',
        'kawaii': 'var(--shadow-kawaii)',
      },

      // Border Radius - references CSS variables
      borderRadius: {
        'kitty-sm': 'var(--radius-sm)',
        'kitty-md': 'var(--radius-md)',
        'kitty-lg': 'var(--radius-lg)',
        'kitty-xl': 'var(--radius-xl)',
        '4xl': '2rem',
      },

      // Backdrop Blur
      backdropBlur: {
        'kawaii': '10px',
      },

      // Animations
      animation: {
        'pawfessor-walk': 'pawfessor-walk 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
        'ellipsis-cycle': 'ellipsis-cycle 2s steps(4, end) infinite',
      },
    },
  },
  plugins: [],
};

export default config;