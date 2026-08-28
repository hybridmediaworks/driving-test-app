import { router } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";

import { api, ApiError } from "@/lib/api";

import { openCheatSheetPdf } from "./cheatSheets";

jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  downloadAsync: jest.fn(),
}));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
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
const mockDownload = FileSystem.downloadAsync as jest.Mock;
const mockAvailable = Sharing.isAvailableAsync as jest.Mock;
const mockShare = Sharing.shareAsync as jest.Mock;
const mockBrowser = WebBrowser.openBrowserAsync as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("openCheatSheetPdf", () => {
  it("downloads via a signed URL and opens it in-app (no browser)", async () => {
    mockGet.mockResolvedValue({ url: "https://api.test/signed?sig=abc" });
    mockDownload.mockResolvedValue({ uri: "file:///cache/cheat-sheet-42.pdf", status: 200 });
    mockAvailable.mockResolvedValue(true);

    await openCheatSheetPdf(42);

    expect(mockGet).toHaveBeenCalledWith("/cheat-sheets/42/download-link");
    expect(mockDownload).toHaveBeenCalledWith(
      "https://api.test/signed?sig=abc",
      "file:///cache/cheat-sheet-42.pdf",
    );
    expect(mockShare).toHaveBeenCalledWith(
      "file:///cache/cheat-sheet-42.pdf",
      expect.objectContaining({ mimeType: "application/pdf" }),
    );
    expect(mockBrowser).not.toHaveBeenCalled();
  });

  it("falls back to the browser when the in-app download fails", async () => {
    mockGet.mockResolvedValue({ url: "https://api.test/signed" });
    mockDownload.mockResolvedValue({ uri: "file:///cache/x.pdf", status: 500 });

    await openCheatSheetPdf(7);

    expect(mockShare).not.toHaveBeenCalled();
    expect(mockBrowser).toHaveBeenCalledWith("https://api.test/signed");
  });

  it("routes to premium on a 403 without downloading", async () => {
    mockGet.mockRejectedValue(new ApiError(403, "This action is unauthorized."));

    await openCheatSheetPdf(7);

    expect(mockDownload).not.toHaveBeenCalled();
    expect(mockBrowser).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith("/premium");
  });
});
