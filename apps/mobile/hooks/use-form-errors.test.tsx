import { act, renderHook } from "@testing-library/react-native";

import { useFormErrors } from "./use-form-errors";

describe("useFormErrors", () => {
  it("seeds from the initial errors and reads the first message per field", () => {
    const { result } = renderHook(() => useFormErrors({ email: ["bad"] }));
    expect(result.current.errorFor("email")).toBe("bad");
  });

  it("errorFor returns the first message, or undefined for an unknown field", () => {
    const { result } = renderHook(() => useFormErrors());
    act(() => result.current.setErrors({ password: ["too short", "and weak"] }));
    expect(result.current.errorFor("password")).toBe("too short");
    expect(result.current.errorFor("missing")).toBeUndefined();
  });

  it("clearError removes only the targeted field", () => {
    const { result } = renderHook(() => useFormErrors());
    act(() => result.current.setErrors({ email: ["bad"], password: ["req"] }));
    act(() => result.current.clearError("email"));
    expect(result.current.errorFor("email")).toBeUndefined();
    expect(result.current.errorFor("password")).toBe("req");
  });

  it("clearError on a clean field keeps the same object reference (avoids a needless re-render)", () => {
    const { result } = renderHook(() => useFormErrors());
    act(() => result.current.setErrors({ email: ["bad"] }));
    const before = result.current.errors;
    act(() => result.current.clearError("password"));
    expect(result.current.errors).toBe(before);
  });
});
