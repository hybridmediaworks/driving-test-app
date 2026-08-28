import { Component, type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorState } from "@/components/ui/error-state";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * App-wide safety net. React unmounts the whole tree when a render throws, which without a boundary
 * shows users a blank white screen (or a native crash). This catches any such error below it and
 * swaps in a recovery screen with a "Try again" button that clears the error and re-renders the
 * children — enough to recover from transient failures (a bad fetch that threw, a null-deref on a
 * slow-loading field) without the user force-quitting the app.
 *
 * It's a class because `getDerivedStateFromError` / `componentDidCatch` have no hook equivalent.
 * The visible fallback is delegated to <ErrorState /> so it stays theme-aware and on-brand.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // Surface it in the dev console / device logs. This is the seam where a crash reporter
    // (Sentry, Bugsnag) would be notified in production.
    console.error("Uncaught render error:", error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900">
        <View className="flex-1 justify-center">
          <ErrorState
            icon="error-outline"
            title="Something went wrong"
            message="The app hit an unexpected problem. You can try again — if it keeps happening, restart the app."
            retryLabel="Try again"
            onRetry={this.reset}
          />
        </View>

        {/* Error detail is developer-facing only; never shown in production builds. */}
        {__DEV__ ? (
          <ScrollView
            className="max-h-40 mx-5 mb-6 rounded-xl bg-secondary-100 dark:bg-secondary-800"
            contentContainerStyle={{ padding: 12 }}
          >
            <Text className="text-xs text-error font-mono">{String(error?.message ?? error)}</Text>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    );
  }
}
