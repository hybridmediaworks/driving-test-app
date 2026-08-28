// Jest is configured on top of the `jest-expo` preset, which wires up the React Native / Expo
// module mocks and the right transformer. We override two things: the `@/…` path alias (mirroring
// tsconfig) and `transformIgnorePatterns` — node_modules ship untranspiled ESM/Flow that Jest must
// still run through Babel (React Native, Expo, NativeWind, and our workspace `@driving-test-app/*`).
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // pnpm nests real packages under `node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>`, so the
  // allowlist has to tolerate an optional `.pnpm/` segment and match on package-name *prefixes*
  // (pnpm appends `@version` and turns scope slashes into `+`, e.g. `@react-native+js-polyfills`).
  transformIgnorePatterns: [
    "node_modules/(?!(?:\\.pnpm/)?(@?react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|nativewind|react-native-css-interop|react-native-svg|@driving-test-app))",
  ],
  // Coverage is scoped to the logic we actually unit-test; screens/navigation are exercised by
  // hand, so pulling them into the coverage denominator would only produce misleading red numbers.
  collectCoverageFrom: [
    "lib/validation.ts",
    "hooks/use-async.ts",
    "hooks/use-form-errors.ts",
    "services/api/todayService.ts",
    "services/api/progressService.ts",
    "components/ui/loading-state.tsx",
    "components/ui/error-state.tsx",
    "components/ui/empty-state.tsx",
    "components/error-boundary.tsx",
  ],
};
