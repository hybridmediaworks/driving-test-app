/** Single source of truth for the app color palette — mirrors apps/web/app/globals.css. */

const Primary = {
  DEFAULT: "#007AFF",
  50: "#EBF4FF",
  100: "#D6E9FF",
  200: "#ADD3FF",
  300: "#7FB8FF",
  400: "#4C9CFF",
  500: "#1A82FF",
  600: "#007AFF",
  700: "#0062CC",
  800: "#004999",
  900: "#003166",
  // Matches --blue-1000 on web (dark navy accent) — same value as Blue1000 below.
  1000: "#0D142C",
};

const Secondary = {
  DEFAULT: "#0A0A0A",
  50: "#FAFAFA",
  100: "#F5F5F5",
  200: "#E5E5E5",
  300: "#D4D4D4",
  400: "#A3A3A3",
  500: "#737373",
  600: "#525252",
  700: "#404040",
  800: "#262626",
  900: "#171717",
  950: "#0A0A0A",
};

const Error = {
  DEFAULT: "#D03B3B",
  50: "#FDF2F2",
  100: "#FBE2E2",
  200: "#F6C6C6",
  300: "#EF9F9F",
  400: "#E56E6E",
  500: "#D03B3B",
  600: "#B32E2E",
  700: "#8F2424",
  800: "#6E1C1C",
  900: "#4F1414",
};

const Success = {
  DEFAULT: "#0CA30C",
  50: "#EEFBEE",
  100: "#D4F5D4",
  200: "#A9EBA9",
  300: "#78DB78",
  400: "#3EC53E",
  500: "#0CA30C",
  600: "#0A8B0A",
  700: "#086E08",
  800: "#065206",
  900: "#043A04",
};

const Warning = {
  DEFAULT: "#FAB219",
  50: "#FFF8E8",
  100: "#FEEDC2",
  200: "#FDDB8A",
  300: "#FCC752",
  400: "#FBBB2F",
  500: "#FAB219",
  600: "#D99306",
  700: "#B37605",
  800: "#8A5A04",
  900: "#5F3D03",
};

const White = {
  DEFAULT: "#FFFFFF",
  off: "#F7F7F7",
};

/** Off-white app background + two subtler steps, matches --background/2/3 on web. */
const Background = {
  DEFAULT: "#FAFAF7",
  2: "#F2F1EC",
  3: "#E7E6E1",
};

/** Standalone muted tone (--grey on web), distinct from the Secondary neutral ramp. */
const Grey = "#8C8C9A";

module.exports = { Primary, Secondary, Error, Success, Warning, White, Background, Grey };
