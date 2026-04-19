/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#f48fb1",
          container: "#f8bbd0",
        },
        on: {
          primary: "#560027",
          surface: "#2c2f33",
          surfaceVariant: "#595b61",
        },
        secondary: {
          DEFAULT: "#4855a5",
          container: "#c9cfff",
        },
        tertiary: {
          DEFAULT: "#73544b",
          container: "#f8cec2",
        },
        background: "#f5f6fc",
        surface: {
          DEFAULT: "#f5f6fc",
          container: {
            lowest: "#ffffff",
            low: "#eff0f7",
            DEFAULT: "#e6e8ef",
            high: "#e0e2ea",
            highest: "#dadde5",
          }
        },
        outline: {
          variant: "rgba(171, 173, 179, 0.15)",
        }
      },
      fontFamily: {
        manrope: ["Manrope", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      borderRadius: {
        "3xl": 24,
        "2xl": 16,
        xl: 12,
      }
    },
  },
  plugins: [],
};

