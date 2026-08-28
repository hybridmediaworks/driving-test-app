import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ErrorBoundary } from "./error-boundary";

describe("ErrorBoundary", () => {
  it("renders its children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <Text>Safe content</Text>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Safe content")).toBeTruthy();
  });

  it("shows the fallback when a child throws and recovers on Try again", () => {
    // React logs caught render errors; silence it so the test output stays clean.
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    let shouldThrow = true;
    function Maybe() {
      if (shouldThrow) throw new Error("boom");
      return <Text>Recovered</Text>;
    }

    render(
      <ErrorBoundary>
        <Maybe />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeTruthy();

    // Fix the underlying condition, then retry — the boundary resets and re-renders its children.
    shouldThrow = false;
    fireEvent.press(screen.getByText("Try again"));

    expect(screen.getByText("Recovered")).toBeTruthy();
    expect(screen.queryByText("Something went wrong")).toBeNull();

    consoleError.mockRestore();
  });
});
