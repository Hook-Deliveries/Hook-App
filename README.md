# Hook

<p align="center">
  <img src="./assets/images/app-icon.png" alt="Hook logo" width="140" />
</p>

<p align="center">
  <strong>The Hook customer app for iOS and Android: shop Nigerian markets from your phone, negotiate the price, pay securely and follow your parcel to your door.</strong>
</p>

Hook is the customer-facing mobile app of the Hook platform. Customers browse products that live in well-known markets such as Balogun and Tejuosho, haggle with an AI-assisted negotiator, check out with a hosted payment page, and track each order from "Hook is sourcing your items" through the hub and the courier to delivery. It is built with Expo and React Native, talks to the Hook backend over REST and Socket.IO, and ships to both the App Store and Google Play from one codebase.

## What This App Covers

- Onboarding, sign-in and sign-up with email and OTP, Google and Apple
- Market and category browsing, search, product pages with variants and sizing
- A guest cart that follows you into your account when you sign in
- AI-assisted price negotiation with locked prices you can use at checkout
- Checkout with delivery address, delivery fee, coupons, Hook credit and VAT
- Hosted payment in an in-app browser, with automatic confirmation when you return
- Orders with a full journey timeline, courier tracking ID and a parcel receipt you can share as a PDF
- Replacement approvals when an item needs a substitute
- Push notifications, an in-app inbox and realtime updates
- Hook credit, referrals, addresses, devices, biometrics and account deletion
- Forced and optional app updates, over-the-air updates, and a "rate this app" prompt

## Core Product Value

Buying from a busy physical market is usually a trip, a negotiation and a lot of trust. Hook turns that into a few taps without hiding what is happening:

- **Fair prices, your way.** Make an offer, get a counter, lock the price you like.
- **Know where your order is.** Every stage is shown: sourcing, at the hub, courier pickup, on its way, delivered, with the courier's tracking ID as soon as it exists.
- **Pay once, safely.** Payments run on a hosted checkout; the app never sees card details.
- **Stay in control.** If an item needs replacing, you approve it before anything changes.

## Key App Features

### Discover and shop

- Home with markets, categories, banners and recently viewed products
- Discover and search with recent searches
- Product detail with color and size selection, availability notes and likes
- Market pages and category shops, scoped by delivery State

### Negotiate

- Start a negotiation on a product, choose a quantity and make an offer as a **total**, so there is never doubt about per-item versus total pricing
- Hook answers with a counter or accepts. Even a low final offer gets Hook's best price rather than a refusal
- The conversation shows each round, how many offers remain, and a suggested "meet in the middle" step
- Accepted prices are locked for a limited time and listed under Offers; they apply automatically in your cart while valid

### Cart and checkout

- Guest cart stored on the device and merged into your account at sign-in
- Optimistic cart updates with a fly-to-cart animation
- Delivery pricing by State, saved addresses, coupons, Hook credit and a clear order summary
- Idempotent checkout requests, so a flaky connection cannot create duplicate orders

### Orders, tracking and receipts

- Orders list with a status pill, item thumbnails and total
- Order details: delivery information, a **Hook parcel receipt**, items, a price breakdown and a journey that shows order placed, payment, sourcing, reached the hub, packed and booked, courier pickup, on its way and delivered
- The courier's **tracking ID** with Copy, Share and a **Track order** button that opens the courier's tracking page
- The parcel receipt screen mirrors the printed hub label: header, order number, QR code, delivery address, courier and tracking, contents and a tracking barcode. **Share receipt** creates a PDF in the same layout
- Pay or share a payment link for unpaid orders, and cancel an unpaid order

### Account and trust

- Email and OTP, Google and Apple sign-in, password reset
- Face ID or fingerprint protection, device management and sign-out of other devices
- Hook credit balance, referral code and rewards
- Help and support, legal pages (terms, privacy, returns), account deletion with a cooling-off period

### Platform quality

- Pull to refresh, skeleton loading that matches the real layout, haptics and motion with Reanimated
- Connection and network banners, and a safe fallback when the backend is unreachable
- Forced and optional store updates driven by the backend's release policy, plus Expo OTA updates with a "restart to update" prompt that never interrupts a payment
- Deep links and push routing: a tapped notification opens the right order, product, market or inbox item

## Tech Stack

- Expo SDK 58, React Native 0.88 (New Architecture), React 19, TypeScript 6
- Expo Router (file-based routing)
- NativeWind 4 and Tailwind CSS 3 for styling
- TanStack Query for server state, AsyncStorage for local persistence
- React Native Reanimated 4, Gesture Handler, Screens, Bottom Sheet
- Expo modules: Notifications, Secure Store, Local Authentication, Image, Image Picker, Print, Sharing, Clipboard, Web Browser, Store Review, Updates, Haptics, Linking
- `@react-native-google-signin/google-signin` and `expo-apple-authentication`
- `socket.io-client` for realtime
- `react-native-svg`, `qrcode-generator` and `jsbarcode` for receipt QR codes and barcodes
- EAS Build, EAS Submit and EAS Update for releases

## Environment Variables

Create `.env` in the project root. Variables prefixed `EXPO_PUBLIC_` are bundled into the app, so they must never contain secrets.

```env
EXPO_PUBLIC_API_URL=https://your-api.example.com/api/v1
EXPO_PUBLIC_WEB_URL=https://your-public-site.example.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
```

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Base URL of the Hook backend, including `/api/v1`. On a device this must be reachable from the phone, not `localhost` |
| `EXPO_PUBLIC_WEB_URL` | The single public web address. Help and support and account deletion links are built from it |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Required: the native SDK returns ID tokens issued to the web client, and the backend verifies against it |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Platform client IDs for Google sign-in |
| `EXPO_PUBLIC_APP_STORE_ID` | Optional alternative to `extra.appStoreId` in `app.json`; powers "Rate this app" on iPhone |
| `GOOGLE_SERVICES_JSON` | Build-time only: path to the Firebase `google-services.json` for Android push. Supplied as an EAS file variable on cloud builds |

For production builds the `EXPO_PUBLIC_*` values come from the EAS `production` environment (`eas env:list production`), not from your local `.env`.

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A running Hook backend (see `../Hook-Backend/README.md`)
- Xcode (macOS) for iOS and Android Studio with JDK 17 for Android
- `eas-cli` for cloud and local EAS builds: `npm install -g eas-cli`

### Install

```bash
npm install
```

### Run in development

Hook uses native modules (Google and Apple sign-in, notifications, biometrics, OTA updates), so it needs a **development build**; Expo Go is not supported.

```bash
npm run ios        # build and run on an iOS simulator or device
npm run android    # build and run on an Android emulator or device
npm start          # start Metro for an installed development build
```

After installing or upgrading a package that includes native code, rebuild the development client. Clear Metro's cache when dependencies change:

```bash
npx expo start -c
```

### Point the app at a backend

- **iOS simulator** reaches your machine at `http://localhost:<port>`.
- **Android emulator** uses `http://10.0.2.2:<port>` for the host machine.
- **A physical phone** needs your computer's LAN IP, or a tunnel, in `EXPO_PUBLIC_API_URL`.

If you run the backend with Docker from the repository root, the API is published on port `14000`.

## Available Scripts

| Script | Purpose |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run ios` / `npm run android` | Build and run the native app |
| `npm run web` | Web preview (limited: native modules are unavailable) |
| `npm run lint` | Expo ESLint |
| `npm run create:apk` | Build a signed Android APK locally (see `APK-BUILD.md`) |
| `npm run build:preview` | EAS preview build for both platforms |
| `npm run build:production` | EAS production build for both platforms |
| `npm run update:preview` / `update:production` | Publish an OTA update to a channel |

Type-check with `npx tsc --noEmit`. Unit tests for the cart helpers run with `node --test tests/*.test.mjs`.

## Important Routes

Routing is file-based under `app/`.

| Route | Screen |
| --- | --- |
| `/splash`, `/onboarding` | First launch |
| `/auth/*` | Email, OTP, password, name, reset flows |
| `/(tabs)` | Home, Discover, Offers, Cart, Profile |
| `/products/[id]`, `/markets/[id]`, `/shop/[categoryId]` | Product, market and category pages |
| `/negotiations/new` | Start a negotiation |
| `/(app)/cart`, `/checkout`, `/payments/[id]` | Cart, checkout and payment status |
| `/orders`, `/orders/[id]`, `/orders/receipt/[id]` | Orders, order details and parcel receipt |
| `/notifications`, `/notifications/[id]` | Inbox and a single notification |
| `/likes`, `/addresses`, `/credits`, `/referrals`, `/states` | Account areas |
| `/profile/edit`, `/profile/security`, `/profile/devices`, `/profile/notifications` | Profile and security |
| `/legal/[type]` | Terms, privacy and returns |

The app scheme is `hook://`. Payment flows return to `hook://payments/return`, and push notifications deep-link through `lib/push-routes.ts`.

## Project Structure

```text
Hook-App/
├── app/                      # Expo Router screens
│   ├── (tabs)/               # Bottom tab screens
│   ├── (app)/                # Stack screens: orders, checkout, products, profile, ...
│   ├── auth/                 # Sign-in and account creation
│   ├── onboarding/  splash/
│   └── _layout.tsx           # Providers, release gate, OTA gate, banners
├── components/
│   ├── marketplace/          # Home, discover, product and market UI
│   ├── negotiation/          # Offer flow, conversation, locked prices
│   ├── cart/  checkout/  payments/
│   ├── orders/               # Order card, tracking journey, parcel receipt, skeleton
│   ├── notifications/  profile/  auth/  onboarding/
│   ├── motion/               # Reveal, skeletons, animations
│   ├── shared/               # Toasts, sheets, banners, loaders, remote image
│   ├── tab-bar/  ui/         # Navigation and primitives
├── lib/
│   ├── api.ts  mobile-api.ts # API client and typed hooks
│   ├── session.ts  auth-api.ts  google-auth.ts  apple-auth.ts
│   ├── query.tsx             # Query client setup
│   ├── push.ts  push-bridge.tsx  push-routes.ts
│   ├── realtime.ts           # Socket.IO connection
│   ├── anonymous-commerce.ts # Guest cart
│   ├── receipt-html.ts  fez-tracking.ts  rate-app.ts
│   └── app-release-policy.ts  release-refresh.ts
├── constants/                # Design tokens, theme, motion
├── hooks/                    # Pull-to-refresh, color scheme, debounce
├── assets/                   # Icons, splash, images, fonts via packages
├── scripts/                  # APK builder
├── tests/                    # Cart helper tests
├── app.json  app.config.js   # Expo config (Firebase file comes from env at build time)
├── eas.json                  # Build and submit profiles
└── ios/                      # Native iOS project (regenerated by prebuild)
```

## How It Works

### API and session

`lib/api.ts` wraps `fetch` with the backend's envelope, timeouts and token refresh. Access and refresh tokens live in the device's secure storage (`expo-secure-store`). State-changing requests that move money or create orders send an `Idempotency-Key`, so a retry is safe. `lib/mobile-api.ts` holds the typed TanStack Query hooks for every screen.

### Guest first

Customers can browse and fill a cart without an account. The guest cart is stored in AsyncStorage and merged into the account after sign-in (`lib/commerce-sync.ts`). Sign-in opens as a sheet in context rather than a separate flow, and returns the customer to where they were.

### Payments

Checkout creates a payment link and opens it in an in-app browser (`openAuthSessionAsync`). When the customer returns through `hook://payments/return`, the app polls the backend until the payment is confirmed or fails, then refreshes the order. Card and bank details are only ever entered on the provider's hosted page.

### Notifications

On sign-in the app registers its Expo push token with the backend. Each push carries a `screen` and `params`, and `routeForPush` decides where a tap goes. A realtime Socket.IO connection updates the inbox and order screens while the app is open.

### Releases and updates

- **Store updates:** the backend publishes the latest and minimum version for each platform. A required update blocks the app with a prompt that opens the store; an optional one nudges.
- **OTA updates:** `expo-updates` checks on launch and whenever the app returns to the foreground, and shows a "restart to update" prompt that never appears during a payment. Builds made without the native updates module still run; OTA is simply skipped.
- **Rate this app:** opens the App Store review screen (iOS, using the App Store ID) or the Play Store page (Android).

## Building and Releasing

Profiles in `eas.json`: `development`, `preview`, `production` and `apk`. Production builds use remote version numbers that increment automatically.

```bash
# Cloud builds
npm run build:preview
npm run build:production

# Local Android App Bundle for Google Play (needs JDK 17 and the Android SDK)
GOOGLE_SERVICES_JSON=./google-services.json eas build --platform android --profile production --local

# Local iOS build for the App Store (uses Xcode and your stored credentials)
eas build --platform ios --profile production --local

# Submit
eas submit --platform ios --profile production
```

Notes:

- **Android push needs `google-services.json`.** It is git-ignored. On EAS cloud builds supply it as the `GOOGLE_SERVICES_JSON` file variable; for local builds point `GOOGLE_SERVICES_JSON` at the file.
- **iOS** requires an Apple distribution certificate and App Store provisioning profile. EAS stores and applies them for you.
- **After adding native packages**, rebuild the binary. An OTA update cannot add native code.
- **Environment variables** for production come from the EAS `production` environment. Local builds do not load EAS secrets automatically.
- `APK-BUILD.md` covers the local APK workflow for side-loading and QA.
- Bundle identifier and Android package are `com.biodun42.hook`.

## Integrations

- **Hook backend**: all data and actions over `/api/v1` and Socket.IO
- **Paystack and Monnify**: hosted checkout opened in the in-app browser
- **Google and Apple**: native sign-in
- **Expo Notifications and Firebase Cloud Messaging**: push delivery (APNs on iOS, FCM on Android)
- **Fez Delivery**: tracking ID and tracking page, plus webhooks handled by the backend
- **App Store and Google Play**: store updates and ratings

## Troubleshooting

- **"Cannot find native module"**: the installed development build predates a package. Rebuild with `npm run ios` or `npm run android`.
- **"Requiring unknown module" or a stale bundle after installing packages**: restart Metro with `npx expo start -c`.
- **Cannot reach the API from a phone**: `localhost` points at the phone. Use your computer's LAN IP, `10.0.2.2` on the Android emulator, or a tunnel.
- **Google sign-in fails on a release build**: check the three `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` values and that the Android SHA fingerprints are registered in Google Cloud.
- **No push on Android**: confirm the build included `google-services.json`.
- **Payments never confirm**: the backend webhook has to reach the API. Check the Paystack or Monnify dashboard and the backend logs.

## Recommended Documentation Pairing

This README documents the mobile app. For the API, jobs, deployment and data model, see `../Hook-Backend/README.md`. For the staff dashboard and the Market Associate and Partner portals, see `../Hook-Admin/README.md`.

## Vision

Hook makes shopping in some of West Africa's busiest markets feel as simple and dependable as any modern store, without taking away the part people love: getting a good price. The app aims to keep every moment honest and clear, from the first offer to the knock on the door.
