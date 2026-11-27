# Project Sanket — Cross-Platform Setup, OS Compatibility & Test Report

## 1. Platform & OS Compatibility Matrix

| Platform | Stack & Verified Versions | Target / Min Support | Notes |
|---|---|---|---|
| **Web** | HTML5 + CSS3 + ES5/Web Speech + MediaPipe Hands WASM (`src/`) | Chrome/Edge (Speech STT/TTS), Safari/Firefox (Text + ISL + TTS) | Zero build step; works offline for text & ISL gloss cards |
| **Android** | React Native `0.88.1` + Expo `58.1.0` + `expo-camera` `58.0.14` (`mobile/`) | `compileSdkVersion: 35`, `targetSdkVersion: 35` (Android 15), `minSdkVersion: 24` (Android 7.0+) | Covers latest stable Android + preceding major releases (Android 14, 13); Material 3, `BackHandler`, TalkBack |
| **iOS (iPhone)** | React Native `0.88.1` + Expo `58.1.0` + `react-native-safe-area-context` (`mobile/`) | `deploymentTarget: 15.1` (iOS 15.1+) | Native Safe Area, VoiceOver, Dynamic Type, `NSCameraUsageDescription` & `NSMicrophoneUsageDescription` |
| **Backend** | FastAPI `0.115.6` + Uvicorn + WebSockets (`backend/`) | Python 3.12+ / Docker | Serves Web UI + `/ws/{room}` Nearby signalling + zero-key BHASHINI proxy |

---

## 2. Setup & Build Instructions

### A. One-Command Docker (Web + FastAPI Nearby Backend)
```bash
docker compose up --build
```
Open `http://localhost:8080` (starts with **zero secret keys**).

### B. Android & iOS (Expo React Native)
```bash
cd mobile
npm install
npx expo start          # Scan QR in Expo Go, or press 'a' (Android) / 'i' (iOS)
npx expo run:android    # Native Android build
npx expo run:ios        # Native iOS build (macOS + Xcode required)
```

---

## 3. Feature Classification (Honest Status)

| Feature | Classification |
|---|---|
| Light-first `#F8F9FF` / `#6655D9` Web UI & Accessibility Controls | **Implemented and tested** |
| Guest-first Neutral Onboarding & 8-Language Switcher | **Implemented and tested** |
| Nearby QR / Expiring Code Pairing & Mutual Acceptance | **Implemented (Web + Mobile)** |
| Cross-device WebSocket Relay (`/ws/{room}`) + `BroadcastChannel` fallback | **Implemented** |
| Text → ISL Glossifier & Word-Specific Visual Sign Cards | **Implemented (19 core signs + fingerspelling)** |
| Handshape Camera (MediaPipe Hands heuristic) | **Partially implemented (limited vocabulary, experimental)** |
| BHASHINI ULCA Proxy (`/api/bhashini/translate`) | **Implemented with `"key_not_set"` local fallback** |
| Android & iOS Expo Apps (`mobile/`) | **Implemented (source code & config; native EAS/Xcode build requires mobile SDKs)** |
| Sanket Calls (Remote Video) & Sanket Assist | **Future roadmap (preview card only)** |
