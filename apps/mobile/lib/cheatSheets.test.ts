import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { api, ApiError } from "@/lib/api";

import { openCheatSheetPdf } from "./cheatSheets";

jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn() }));
jest.mock("@/lib/api", () => ({
  api: { get: jest.fn() },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

const mockGet = api.get as jest.Mock;
const mockBrowser = WebBrowser.openBrowserAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("openCheatSheetPdf", () => {
  it("opens the signed PDF URL directly (the 'Read' CTA — no share sheet)", async () => {
    mockGet.mockResolvedValue({ url: "https://api.test/signed?sig=abc" });

    await openCheatSheetPdf(42);

    expect(mockGet).toHaveBeenCalledWith("/cheat-sheets/42/download-link");
    // The PDF opens straight in the in-app browser for reading.
    expect(mockBrowser).toHaveBeenCalledWith("https://api.test/signed?sig=abc");
  });

  it("routes to premium on a 403 without opening anything", async () => {
    mockGet.mockRejectedValue(new ApiError(403, "This action is unauthorized."));

    await openCheatSheetPdf(7);

    expect(mockBrowser).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/premium");
  });
});
