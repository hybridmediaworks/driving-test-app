import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useAsync } from "./use-async";

// expo-router's useFocusEffect is mocked to behave like useEffect in jest.setup.ts, so the
// refetchOnFocus path runs on mount here just like a normal effect.

describe("useAsync", () => {
  it("transitions loading -> success and exposes the resolved data", async () => {
    const fn = jest.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useAsync(fn, []));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toEqual({ ok: true });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("captures a rejection as an error status and keeps data undefined", async () => {
    const err = new Error("nope");
    const fn = jest.fn().mockRejectedValue(err);
    const { result } = renderHook(() => useAsync(fn, []));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe(err);
    expect(result.current.data).toBeUndefined();
  });

  it("refetch re-runs the function", async () => {
    const fn = jest.fn().mockResolvedValue(1);
    const { result } = renderHook(() => useAsync(fn, []));
    await waitFor(() => expect(result.current.status).toBe("success"));

    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() => expect(fn).toHaveBeenCalledTimes(2));
  });

  it("keeps the previous data while a refetch is in flight (no flash to empty)", async () => {
    const fn = jest
      .fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");
    const { result } = renderHook(() => useAsync(fn, []));
    await waitFor(() => expect(result.current.data).toBe("first"));

    act(() => {
      result.current.refetch();
    });
    // Immediately after: loading again, but the last-known data is still shown.
    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBe("first");

    await waitFor(() => expect(result.current.data).toBe("second"));
  });

  it("does not call fn when disabled and settles to success with no data", async () => {
    const fn = jest.fn().mockResolvedValue(1);
    const { result } = renderHook(() => useAsync(fn, [], { enabled: false }));

    expect(result.current.status).toBe("success");
    expect(result.current.data).toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
  });
});
