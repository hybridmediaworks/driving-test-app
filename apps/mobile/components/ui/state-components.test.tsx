import { fireEvent, render, screen } from "@testing-library/react-native";

import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { LoadingState } from "./loading-state";

describe("LoadingState", () => {
  it("renders an optional label", () => {
    render(<LoadingState label="Loading your progress…" />);
    expect(screen.getByText("Loading your progress…")).toBeTruthy();
  });
});

describe("ErrorState", () => {
  it("shows default copy and no retry button when onRetry is omitted", () => {
    render(<ErrorState />);
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.queryByText("Try again")).toBeNull();
  });

  it("calls onRetry when the retry button is pressed", () => {
    const onRetry = jest.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.press(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("accepts custom title and message", () => {
    render(<ErrorState title="You're offline" message="Reconnect and retry." />);
    expect(screen.getByText("You're offline")).toBeTruthy();
    expect(screen.getByText("Reconnect and retry.")).toBeTruthy();
  });
});

describe("EmptyState", () => {
  it("renders the title and optional message", () => {
    render(<EmptyState title="Nothing here yet" message="Check back soon." />);
    expect(screen.getByText("Nothing here yet")).toBeTruthy();
    expect(screen.getByText("Check back soon.")).toBeTruthy();
  });

  it("renders an action button only when both label and handler are provided", () => {
    const onAction = jest.fn();
    const { rerender } = render(
      <EmptyState title="Empty" actionLabel="Refresh" onAction={onAction} />,
    );
    fireEvent.press(screen.getByText("Refresh"));
    expect(onAction).toHaveBeenCalledTimes(1);

    rerender(<EmptyState title="Empty" />);
    expect(screen.queryByText("Refresh")).toBeNull();
  });
});
