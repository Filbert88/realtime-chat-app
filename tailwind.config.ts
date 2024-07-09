import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      colors:{
        'custom-green' : "#64ffda",
        red: "#E50914",
        'base': "#161B22"
      }
    },
  },
  plugins: [],
} satisfies Config;
