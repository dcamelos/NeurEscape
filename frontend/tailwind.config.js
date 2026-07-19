/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1B3A5C",
        "brain-frontal": "#4A90D9",
        "brain-hipocampo": "#7B68EE",
        "brain-temporal": "#E8A838",
        "brain-parietal": "#5CB85C",
        "brain-occipital": "#D9534F",
      },
      fontFamily: {
        mono: ["'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};
