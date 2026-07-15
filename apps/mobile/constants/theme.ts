import { Platform } from "react-native";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Primary, Secondary, Error, Success, Warning, White } =
  require("./colors") as {
    Primary: Record<string | "DEFAULT", string>;
    Secondary: Record<string | "DEFAULT", string>;
    Error: Record<string | "DEFAULT", string>;
    Success: Record<string | "DEFAULT", string>;
    Warning: Record<string | "DEFAULT", string>;
    White: Record<string | "DEFAULT", string>;
  };

export { Error, Primary, Secondary, Success, Warning, White };

export const Colors = {
  light: {
    text: Secondary[900],
    background: White.DEFAULT,
    tabBackground: Secondary[100],
    tabBorder: Secondary[200],
    tint: Primary.DEFAULT,
    icon: Secondary[500],
    tabIconDefault: Secondary[400],
    tabIconSelected: Primary.DEFAULT,
  },
  dark: {
    text: Secondary[50],
    background: Secondary[900],
    tabBackground: Secondary[800],
    tabBorder: Secondary[700],
    tint: Primary[400],
    icon: Secondary[400],
    tabIconDefault: Secondary[500],
    tabIconSelected: Primary[400],
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
