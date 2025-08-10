import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
import { heroui } from "@heroui/theme";

export default {
  theme: {
    extend: {
      colors: {
        primary: colors.blue,
        secondary: colors.violet,
        success: colors.emerald,
        warning: colors.amber,
        danger: colors.rose,
        default: colors.neutral, // for text-default-500, etc.
      },
    },
  },
  plugins: [heroui()],
} as Config;
