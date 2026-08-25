// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Primary, Secondary, Error, Success, Warning, White, Background, Grey } =
  require("./colors") as {
    Primary: Record<string | "DEFAULT", string>;
    Secondary: Record<string | "DEFAULT", string>;
    Error: Record<string | "DEFAULT", string>;
    Success: Record<string | "DEFAULT", string>;
    Warning: Record<string | "DEFAULT", string>;
    White: Record<string | "DEFAULT", string>;
    Background: Record<string | "DEFAULT", string>;
    Grey: string;
  };

export { Error, Primary, Secondary, Success, Warning, White, Background, Grey };

export const Colors = {
  light: {
    text: Secondary[950],
    background: Background.DEFAULT,
    tabBackground: Secondary[100],
    tabBorder: Secondary[200],
    tint: Primary.DEFAULT,
    icon: Secondary[500],
    tabIconDefault: Secondary[400],
    tabIconSelected: Primary.DEFAULT,
  },
  dark: {
    text: Secondary[50],
    background: Secondary[950],
    tabBackground: Secondary[900],
    tabBorder: Secondary[800],
    tint: Primary[400],
    icon: Secondary[400],
    tabIconDefault: Secondary[500],
    tabIconSelected: Primary[400],
  },
};

/** Body copy = Inter, headings = Sora — mirrors --font-sans/--font-sora on web. */
export const Fonts = {
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  heading: "Sora_600SemiBold",
  headingBold: "Sora_700Bold",
};
