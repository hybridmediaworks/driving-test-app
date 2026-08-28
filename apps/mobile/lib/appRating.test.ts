import * as Linking from "expo-linking";
import { Alert, Platform } from "react-native";

import { requestAppRating } from "./appRating";

jest.mock("expo-linking", () => ({ openURL: jest.fn() }));
jest.mock("expo-store-review", () => ({ storeUrl: jest.fn(() => null) }));

const mockOpenURL = Linking.openURL as jest.Mock;
const ANDROID_MARKET = "market://details?id=com.tassawer2008.drivingtest";
const ANDROID_WEB =
  "https://play.google.com/store/apps/details?id=com.tassawer2008.drivingtest";

describe("requestAppRating on Android", () => {
  const originalOS = Platform.OS;
  beforeAll(() => {
    Platform.OS = "android";
  });
  afterAll(() => {
    Platform.OS = originalOS;
  });
  beforeEach(() => jest.clearAllMocks());

  it("opens the native Play Store app first", async () => {
    mockOpenURL.mockResolvedValue(undefined);

    await requestAppRating();

    expect(mockOpenURL).toHaveBeenCalledWith(ANDROID_MARKET);
    expect(mockOpenURL).toHaveBeenCalledTimes(1);
  });

  it("falls back to the web listing when the store app can't be opened", async () => {
    mockOpenURL
      .mockRejectedValueOnce(new Error("no Play Store app"))
      .mockResolvedValueOnce(undefined);

    await requestAppRating();

    expect(mockOpenURL).toHaveBeenNthCalledWith(1, ANDROID_MARKET);
    expect(mockOpenURL).toHaveBeenNthCalledWith(2, ANDROID_WEB);
  });

  it("alerts the user when nothing can be opened", async () => {
    mockOpenURL.mockRejectedValue(new Error("cannot open"));
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

    await requestAppRating();

    expect(alert).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });
});
