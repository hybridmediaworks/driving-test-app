import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { createApiClient, ApiError } from "@driving-test-app/shared";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8001/api/v1";

const TOKEN_KEY = "auth_token";
const GUEST_TOKEN_KEY = "guest_token";

// expo-secure-store wraps the native iOS/Android keychain and has no web
// implementation, so the web build (react-native-web) falls back to
// AsyncStorage there instead of crashing.
function getToken(): Promise<string | null> {
  if (Platform.OS === "web") return AsyncStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

// A stable, opaque per-install id sent as `X-Guest-Token` while signed out, so a guest's quiz
// attempts are tagged server-side and can be claimed into their account on login/register
// (see AuthController::claimGuestData). Generated once, then persisted.
let cachedGuestToken: string | null = null;

function generateGuestToken(): string {
  // RFC4122-style v4 id, no native crypto dependency. Well under the backend's 64-char limit.
  return "gxxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getGuestToken(): Promise<string | null> {
  if (cachedGuestToken) return cachedGuestToken;
  try {
    let token = await AsyncStorage.getItem(GUEST_TOKEN_KEY);
    if (!token) {
      token = generateGuestToken();
      await AsyncStorage.setItem(GUEST_TOKEN_KEY, token);
    }
    cachedGuestToken = token;
    return token;
  } catch {
    return null;
  }
}

export function setToken(token: string | null): Promise<void> {
  if (Platform.OS === "web") {
    return token
      ? AsyncStorage.setItem(TOKEN_KEY, token)
      : AsyncStorage.removeItem(TOKEN_KEY);
  }
  return token
    ? SecureStore.setItemAsync(TOKEN_KEY, token)
    : SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const api = createApiClient({ baseUrl: API_URL, getToken, getGuestToken });

export { ApiError };
