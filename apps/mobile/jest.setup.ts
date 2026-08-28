/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories must use require():
   they're hoisted above imports and can't close over module-scope bindings. */

// Runs before each test file. @testing-library/react-native (v13) registers its Jest matchers
// automatically, so this only needs to hold cross-cutting mocks.

// AsyncStorage has no native module under Jest — use the library's official in-memory mock so any
// code path that touches it (stores, the API token cache) works in tests.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// @expo/vector-icons loads fonts asynchronously and setStates after render, which fires spurious
// "not wrapped in act(...)" warnings in tests. Icons are decorative here, so stub them to a no-op.
jest.mock("@expo/vector-icons/MaterialIcons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => React.createElement(Text, props, null),
  };
});

// SafeAreaView reads from a provider that isn't mounted in unit tests — stub it to a plain View
// with zero insets so components that wrap themselves in SafeAreaView render without a provider.
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// `expo-router`'s `useFocusEffect` throws outside a navigation container. Our hooks call it
// unconditionally, so map it onto a plain `useEffect` for tests — the "focus" event is emulated as
// "mounted", which is exactly what the hook tests want to assert against.
jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useFocusEffect: (callback: React.EffectCallback) => React.useEffect(callback, [callback]),
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => ({}),
  };
});
