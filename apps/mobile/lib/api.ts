import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { createApiClient, ApiError } from "@driving-test-app/shared";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8001/api/v1";

const TOKEN_KEY = "auth_token";

// expo-secure-store wraps the native iOS/Android keychain and has no web
// implementation, so the web build (react-native-web) falls back to
// AsyncStorage there instead of crashing.
function getToken(): Promise<string | null> {
  if (Platform.OS === "web") return AsyncStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
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

export const api = createApiClient({ baseUrl: API_URL, getToken });

export { ApiError };
