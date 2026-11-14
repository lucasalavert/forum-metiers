// 1. Responsabilité : Configuration Tailwind CSS avec la charte graphique de la plateforme
// 2. Dépendances clés : tailwindcss
// 3. Mots-clés métier : tailwind_config, saint_paul_palette, colors, typography, theme

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stpaul: {
          primary: "#EB5E57",     // Abricot / Saumon Lycée Général
          nuit: "#272154",        // Bleu Nuit institutionnel
          fonce: "#312783",       // Bleu Foncé secondaire
          clair: "#00B1EB",       // Bleu Clair accent
          beige: "#F3F1F0",       // Fond Light Beige
          vert: "#00A68D",        // Vert succès / confirmation
          violet: "#9E2986",      // Violet spécialités / accents
          rouge: "#E62154",       // Rouge alerte
        }
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      borderRadius: {
        'card': '1.25rem',
      }
    },
  },
  plugins: [],
}
