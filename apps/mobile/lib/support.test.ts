import * as Linking from "expo-linking";
import { Alert } from "react-native";

import { reportAnIssue, SUPPORT_EMAIL } from "./support";

jest.mock("expo-linking", () => ({ openURL: jest.fn() }));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.2.3" } },
}));

const mockOpenURL = Linking.openURL as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("reportAnIssue", () => {
  it("opens the mail app with a support-addressed, pre-filled draft", async () => {
    mockOpenURL.mockResolvedValue(undefined);

    await reportAnIssue();

    expect(mockOpenURL).toHaveBeenCalledTimes(1);
    const url = mockOpenURL.mock.calls[0][0] as string;
    expect(url.startsWith(`mailto:${SUPPORT_EMAIL}`)).toBe(true);
    expect(url).toContain(`subject=${encodeURIComponent("DMV Genie — Issue report")}`);
    // App version is folded into the body so support doesn't have to ask for it.
    expect(decodeURIComponent(url)).toContain("App version: 1.2.3");
  });

  it("falls back to an alert when no mail client can be opened", async () => {
    mockOpenURL.mockRejectedValue(new Error("no mail app"));
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    await reportAnIssue();

    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0][1]).toContain(SUPPORT_EMAIL);
    alert.mockRestore();
  });
});
