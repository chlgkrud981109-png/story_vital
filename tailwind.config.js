import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "primary-fixed-dim": "#9c7eff",
        "surface-variant": "#25252a",
        "error-container": "#a70138",
        "secondary-dim": "#ba85fb",
        "on-tertiary-fixed": "#380019",
        "primary-fixed": "#a98fff",
        "on-secondary-fixed-variant": "#6834a6",
        "outline-variant": "#48474b",
        "error": "#ff6e84",
        "secondary": "#bc87fe",
        "tertiary": "#ff97b8",
        "tertiary-dim": "#ef77a0",
        "primary-dim": "#7e51ff",
        "on-surface": "#f0edf1",
        "secondary-fixed-dim": "#d7b5ff",
        "surface": "#0e0e11",
        "secondary-container": "#5e289b",
        "background": "#0e0e11",
        "surface-container-lowest": "#000000",
        "on-tertiary-container": "#59002b",
        "on-secondary-container": "#e1c5ff",
        "on-tertiary-fixed-variant": "#70103b",
        "inverse-surface": "#fcf8fd",
        "primary-container": "#a98fff",
        "surface-container": "#19191d",
        "on-surface-variant": "#acaaae",
        "on-background": "#f0edf1",
        "inverse-primary": "#6834eb",
        "surface-container-high": "#1f1f23",
        "secondary-fixed": "#e2c7ff",
        "on-error-container": "#ffb2b9",
        "surface-container-highest": "#25252a",
        "surface-container-low": "#131316",
        "on-secondary-fixed": "#4a0b87",
        "on-secondary": "#340064",
        "on-tertiary": "#6a0936",
        "outline": "#767579",
        "surface-tint": "#b6a0ff",
        "primary": "#b6a0ff",
        "error-dim": "#d73357",
        "on-error": "#490013",
        "on-primary-fixed-variant": "#32008a",
        "tertiary-fixed": "#ff8db2",
        "tertiary-fixed-dim": "#f57ca5",
        "surface-dim": "#0e0e11",
        "inverse-on-surface": "#555458",
        "on-primary-container": "#280072",
        "surface-bright": "#2c2c30",
        "on-primary": "#340090",
        "on-primary-fixed": "#000000",
        "tertiary-container": "#fc81ab"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "sm": "0.25rem",
        "md": "0.375rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "full": "9999px"
      },
      "fontFamily": {
        "headline": ["Manrope"],
        "body": ["Inter"],
        "label": ["Inter"]
      }
    },
  },
  plugins: [forms, containerQueries]
}
