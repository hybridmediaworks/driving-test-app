# Driving Test App

A cross-platform mobile application built with React Native and Expo to help users prepare for their driving test. Covers theory questions, practice exams, a challenge bank, and daily study sessions.

## Tech Stack

| Technology | Version |
|---|---|
| React Native | 0.81.5 |
| Expo | ~54.0.33 |
| React | 19.1.0 |
| TypeScript | ~5.9.2 |
| Expo Router | ~6.0.23 |
| NativeWind | ^4.2.3 |
| react-native-reanimated | ~4.1.1 |

## Features

- **File-based routing** via Expo Router
- **Tab navigation** — Today, Challenge Bank, and Settings screens
- **Onboarding flow** — multi-step setup screens
- **Animated sticky header** — scroll-driven animations with shadow
- **Light & dark mode** — automatic, based on system preference
- **Animations** powered by `react-native-reanimated`
- **Cross-platform** — Android, iOS, and Web
- **NativeWind (Tailwind CSS)** for styling

## Project Structure

```
driving-test/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator layout
│   │   ├── index.tsx             # Today screen
│   │   ├── challange-bank.tsx    # Challenge Bank screen
│   │   └── settings.tsx          # Settings screen
│   ├── onboarding/               # Onboarding flow screens
│   ├── _layout.tsx               # Root layout (navigation + theme)
├── components/
│   ├── ui/
│   │   ├── button.tsx            # Button component
│   │   ├── heading.tsx           # Heading (h1–h6) component
│   │   ├── input.tsx             # Text input component
│   │   ├── checkbox-card.tsx     # Checkbox selection card
│   │   ├── selection-card.tsx    # Radio selection card
│   │   └── screen-header.tsx     # Back-button header
│   └── today/
│       ├── today-header.tsx      # Animated sticky header
│       ├── section-header.tsx    # Section title + badge
│       ├── test-card.tsx         # Test item card
│       ├── theory-section.tsx    # Theory question list
│       ├── theory-item.tsx       # Single theory row
│       ├── exam-card.tsx         # Exam progress card
│       ├── feedback-card.tsx     # Feedback/rating card
│       └── promo-card.tsx        # Promotional banner card
├── constants/
│   ├── colors.js                 # Color palette (single source of truth)
│   └── theme.ts                  # Colors + font definitions
├── hooks/
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
└── assets/
    └── images/
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- For iOS: Xcode (macOS only)
- For Android: Android Studio with an emulator configured

### Installation

```bash
npm install
```

### Running the App

```bash
# Start the Expo development server
npx expo start

# or target a specific platform
npm run android
npm run ios
npm run web
```

Once the dev server is running, open the app with:

- **Expo Go** (scan the QR code) — quickest way to test on a real device
- **Android emulator** — press `a` in the terminal
- **iOS simulator** — press `i` in the terminal (macOS only)
- **Web browser** — press `w` in the terminal

### Linting

```bash
npm run lint
```

## Building an APK (Android)

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) for cloud-based builds. No local Android Studio or Java setup required.

### First-time setup

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Configure EAS for the project (only needed once)
eas build:configure
```

### Build an APK (test/preview)

```bash
eas build -p android --profile preview
```

When the build finishes, EAS provides a download link for the `.apk` file that can be installed directly on any Android device.

### Build for Play Store (AAB)

```bash
eas build -p android --profile production
```

### Check previous builds

```bash
eas build:list
```

### Before each build — version bump

Update `app.json` before each new release:

```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

- `version` — shown to users in the store
- `versionCode` — must increment with every Play Store upload (integer)

## Development

Primary screens live in `app/(tabs)/`. Tab layout and styling is configured in `app/(tabs)/_layout.tsx`. Changes hot-reload automatically during development.

Open developer tools at runtime:

| Platform | Shortcut |
|---|---|
| iOS | `cmd + d` |
| Android | `cmd + m` |
| Web | `F12` |

## Color Palette

All colors are defined in `constants/colors.js` and extended into Tailwind via `tailwind.config.js`.

| Token | Default | Usage |
|---|---|---|
| `primary` | `#16A34A` | Green — buttons, selected states |
| `secondary` | `#000000` | Grays — text, borders, backgrounds |
| `error` | `#DC2626` | Red — errors, destructive actions |
| `success` | `#16A34A` | Green — success states |
| `warning` | `#D97706` | Amber — warnings, highlights |
| `white` | `#FFFFFF` | White — light mode backgrounds |

## Resources

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [React Native documentation](https://reactnative.dev/docs/getting-started)
- [NativeWind](https://www.nativewind.dev/)
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)
