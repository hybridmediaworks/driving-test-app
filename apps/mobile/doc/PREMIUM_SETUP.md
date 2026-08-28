# Premium subscriptions (RevenueCat) — setup

The app sells premium through the **App Store / Google Play** using **RevenueCat** — the
store-compliant way (Apple/Google reject Stripe for in-app digital subscriptions). All the code is
already wired; what remains is account/store configuration, which only you can do.

## What the code already does

- **Mobile** (`services/purchases.ts`): configures the RevenueCat SDK, ties purchases to the
  backend user id (`app_user_id`), and drives the buy / restore flow from the paywall
  (`components/premium/trial-sheet.tsx`). It is **Expo-Go-safe** — in Expo Go (or without keys) it
  no-ops and the button says "coming soon"; real purchases need a dev/prod build.
- **Backend**: `POST /api/v1/revenuecat/webhook` receives RevenueCat events and writes
  `users.revenuecat_premium_until`; `EntitlementResolver` treats a future value as active premium,
  so every locked quiz / feature unlocks automatically.

## What you need to set up (one-time)

### 1. Accounts

- Apple Developer Program ($99/yr) + Google Play Developer ($25 one-time).
- A free [RevenueCat](https://www.revenuecat.com) account.

### 2. Store products

- **App Store Connect** → your app → Subscriptions → create the subscription group + products
  (e.g. `premium_weekly`, `premium_monthly`), matching the plans/prices you show.
- **Google Play Console** → Monetize → Subscriptions → create the same products.

### 3. RevenueCat dashboard

1. Add your iOS app and Android app (with the App Store / Play credentials).
2. **Entitlements** → create one with identifier **`premium`** (or set
   `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT` to whatever you choose).
3. **Products** → import the store products; attach them to the `premium` entitlement.
4. **Offerings** → create a "current" offering containing those packages (this is what the paywall
   buys).
5. **API keys** → copy the **public SDK keys** (one per platform).
6. **Integrations → Webhooks** → add:
   - URL: `https://<your-api-host>/api/v1/revenuecat/webhook`
   - Authorization header: a strong secret.

### 4. Environment variables

**Mobile** (`apps/mobile/.env`):

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxx
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT=premium
```

**Backend** (`apps/api/.env`) — the same secret you set in the RevenueCat webhook:

```
REVENUECAT_WEBHOOK_AUTH=<the-strong-secret>
```

### 5. Build (RevenueCat is native — Expo Go won't work)

```
cd apps/mobile
eas build --profile development --platform ios      # or android
```

Install that dev build on a device/simulator, sign in, open the paywall, and buy with a
**sandbox** store account. The webhook flips the user to premium; locked content unlocks on the
next data refresh. Test **Restore** too (App Store requires it).

## Notes

- `app_user_id` = your backend user id (set on login via `Purchases.configure`). So the webhook
  maps purchases straight to the right User.
- Cancellations keep access until the period ends (`expiration_at_ms`); `EXPIRATION` events clear
  premium. Lifetime/non-renewing products grant far-future access.
- Web keeps using Stripe (`/billing/*`) — unaffected. This is mobile-only.
