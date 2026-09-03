import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string;
  type: ToastType;
  /** Bumps on every show() so the <Toast/> re-triggers even for the same message back-to-back. */
  token: number;
  visible: boolean;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  message: "",
  type: "success",
  token: 0,
  visible: false,
  show: (message, type = "success") =>
    set({ message, type, visible: true, token: get().token + 1 }),
  hide: () => set({ visible: false }),
}));

/**
 * Fire-and-forget toast helper usable from anywhere (no hook needed):
 *   toast.success("Added to Quiz Vault")
 */
export const toast = {
  success: (message: string) => useToastStore.getState().show(message, "success"),
  error: (message: string) => useToastStore.getState().show(message, "error"),
  info: (message: string) => useToastStore.getState().show(message, "info"),
};
