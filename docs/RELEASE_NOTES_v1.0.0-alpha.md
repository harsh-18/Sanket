# Sanket v1.0.0-alpha — Cross-Platform Release (Web, Android & iOS)

> **Different ways to communicate. One shared conversation.**  
> Built on branch `feature/modern-ui` (`main` remains preserved with original prototype files).

---

## 1. What We Have Done & Key Changes

- **Light-First Accessible UI (`#F8F9FF` / `#FFFFFF` / `#6655D9`):** Redesigned the Web app and built matching **Android (Material 3)** and **iOS (Safe Area / VoiceOver / Dynamic Type)** Expo React Native apps in `mobile/` sharing `@sanket/shared`.
- **Two-Way Nearby Communication (MVP):**
  - **Connect Nearby:** QR code generation/scanning, 5-minute expiring pairing codes, and mutual **Accept / Decline** connection confirmation.
  - **Real-Time Relay:** FastAPI + WebSocket (`/ws/{room}`) signalling in `backend/` with `BroadcastChannel` fallback for static hosting.
- **Speech ⇄ Indian Sign Language (ISL) Pipeline:**
  - Focused on **Hindi (`hi-IN`)** and **English (`en-IN`)** with interim + final speech recognition, `✓ Send`, and Text-to-Speech.
  - Integrated **35 real English/digit ISL reference photos (`1`–`9`, `A`–`Z`)** from **ISLVT** (*Waghmare & Deshpande, 2024, doi:10.17632/98mzk82wbb.1*) and **40 real Hindi Devanagari ISL photos** from **Indian Sign Language - Hindi** (*Krish Bhagat, Kaggle*), plus 27 core ISL word flashcards.
- **Zero-Key Startup & Docker:** Runs with **zero secret keys** via `docker compose up --build` (`http://localhost:8080`) or live at **https://harsh-18.github.io/Sanket/**.

---

## 2. Current Build Status

| Platform | Status | Notes |
|---|---|---|
| **Web App + FastAPI Backend** | **Live & Verified** | Deployed at https://harsh-18.github.io/Sanket/ (`backend/test_main.py` 4/4 passing) |
| **Android (`mobile/`)** | **Source Complete (Expo SDK 58 / RN 0.88.1)** | Configured for Android 15 (`targetSdkVersion 35`, `minSdkVersion 24`). Pre-built `.apk` requires Android SDK or `eas build`. |
| **iOS (`mobile/`)** | **Source Complete (Expo SDK 58 / RN 0.88.1)** | Configured for iOS `15.1+` with `Info.plist` camera/mic permissions. Pre-built `.ipa` requires macOS/Xcode or `eas build`. |

---

## 3. How to Install & Sideload

### Option A: Quickest Preview on Android & iOS (Expo Go)
1. Download and extract the release source archive, then run:
   ```bash
   cd mobile
   npm install
   npx expo start
   ```
2. Scan the QR code using **Expo Go** (Android) or the **iPhone Camera** (opens in Expo Go on iOS).

### Option B: Android APK Sideloading
1. Build an installable `.apk` using Expo EAS (`eas build -p android --profile preview`) or locally with Android Studio (`npx expo run:android --variant release`).
2. Transfer the `.apk` to your Android phone.
3. On Android, open **Settings → Apps → Special app access → Install unknown apps** and allow your file manager or browser.
4. Tap the `.apk` file → **Install** → grant **Camera** and **Microphone** permissions when prompted.

### Option C: iOS Installation & Sideloading (TestFlight / Direct `.ipa`)
1. **Via Apple TestFlight (Recommended for iPhone):**
   - Build & submit from macOS or Expo EAS (`eas build -p ios` then `eas submit -p ios` to App Store Connect).
   - Install **TestFlight** from the iOS App Store.
   - Open the TestFlight invite link on your iPhone → tap **Accept** → **Install** (no developer cable required; builds remain active for 90 days).
2. **Direct `.ipa` Sideload (macOS Xcode / AltStore / Sideloadly):**
   - Connect your iPhone via USB, open **Xcode → Window → Devices and Simulators**, and drag the signed `.ipa` onto your device (or sideload via AltStore).
   - On your iPhone, go to **Settings → General → VPN & Device Management**, select the developer profile, and tap **Trust**.
