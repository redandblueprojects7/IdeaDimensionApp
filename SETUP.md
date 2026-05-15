# Idea Dimension App — Setup Checklist

## Status Key
- ✅ Done
- 🔧 Needs your action
- ⏳ Future / not yet started

---

## 1. Project & Dev Environment ✅

- ✅ Expo + React Native project scaffolded
- ✅ 4 tabs: Home, Videos, Store, Events
- ✅ Settings screen (top-right cog on Home)
- ✅ Embedded YouTube video player
- ✅ Embedded Shopify storefront WebView
- ✅ Events screen wired to Supabase
- ✅ Logo banner in header
- ✅ Android build config (`eas.json`, package ID set)

---

## 2. YouTube Data API — Live Video Feed 🔧

The app auto-pulls your latest videos from `@idimensionpodcast`. No manual IDs needed.

**Steps:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. "Idea Dimension App")
3. Go to **Library** → search **YouTube Data API v3** → click **Enable**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. (Recommended) Click the key → **Restrict key** → API restrictions → YouTube Data API v3
6. Copy the key
7. Create a file called `.env` in the `IdeaDimensionApp/` folder (copy `.env.example` as a starting point)
8. Paste: `EXPO_PUBLIC_YOUTUBE_API_KEY=YOUR_KEY_HERE`

**Free quota:** 10,000 units/day — more than enough for a personal app.

---

## 3. Shopify Storefront API — Live Products 🔧

The Store tab WebView already shows your live store. This step enables the product cards (with images, prices, and direct links) to pull automatically.

**Steps:**
1. Log in to [Shopify Admin](https://admin.shopify.com) for shoutmyband.co.uk
2. Go to **Settings** → **Apps and sales channels** → **Develop apps**
3. Click **Allow custom app development** if prompted
4. Click **Create an app** → give it a name (e.g. "Idea Dimension Mobile")
5. Go to **Configuration** → **Storefront API integration**
6. Enable these scopes: `unauthenticated_read_product_listings`, `unauthenticated_read_products`
7. Click **Save** then **Install app**
8. Copy the **Storefront API access token**
9. In your `.env` file, paste: `EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=YOUR_TOKEN_HERE`

---

## 4. Supabase — Events Database 🔧

Your Supabase account is created. See `supabase-setup.sql` in this folder for the exact table to run.

**Steps:**
1. Go to [supabase.com](https://supabase.com) → open your project
2. Go to **SQL Editor** → paste and run the contents of `supabase-setup.sql`
3. Go to **Settings** → **API**
4. Copy **Project URL** and **anon public** key
5. In your `.env` file, add:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```
6. To add events: go to **Table Editor** → `events` table → **Insert row**

---

## 5. Environment File 🔧

Create a file called `.env` inside `IdeaDimensionApp/` (it is gitignored by default):

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_YOUTUBE_API_KEY=
EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=
```

Fill in each value from steps 2–4 above.  
Restart the Expo dev server after saving (`Ctrl+C` then `npx expo start`).

---

## 6. Test on Your Phone ✅ (already working)

1. Install **Expo Go** from the Google Play Store
2. Run `npx expo start` in the `IdeaDimensionApp/` folder
3. Scan the QR code shown in the terminal with Expo Go
4. The app loads live — any code save updates it instantly

---

## 7. Publish to Google Play 🔧 ⏳

These steps are for when you are ready to publish.

**You will need:**
- [ ] A [Google Play Developer account](https://play.google.com/console) ($25 one-time fee)
- [ ] An [Expo account](https://expo.dev) (free)
- [ ] A privacy policy URL (required by Google — a simple page on your website works)
- [ ] App icon, feature graphic, and screenshots for the Play Store listing

**Build steps:**
```bash
npm install -g eas-cli
npx eas login
npx eas build:configure
npx eas build -p android --profile production
```

Then upload the `.aab` file to Google Play Console → Internal Testing → promote to Production when ready.

---

## 8. Future Features ⏳

- [ ] User accounts (Supabase Auth or Firebase Auth)
- [ ] In-app purchases / subscriptions (RevenueCat recommended)
- [ ] Push notifications for upcoming gigs (Expo Notifications)
- [ ] Admin screen to add/edit events from the phone
- [ ] iOS App Store release (requires a Mac or EAS cloud build)
