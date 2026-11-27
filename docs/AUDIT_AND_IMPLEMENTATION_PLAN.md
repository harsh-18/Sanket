# Project Sanket — Stage 1: Prototype Audit, Gap Analysis, Competitor Benchmark & Implementation Plan

**Branch:** `feature/modern-ui` (`main` remains untouched at `51c1ee5`)  
**Date:** 2026-11-28  
**Environment Verified:** Node `v26.13.1`, npm `11.20.0`, Python `3.13.14` (Docker CLI not installed locally on this Windows host)

---

## 1. Existing Repository Audit

### 1.1 Current Tech Stack & Files
- **Frontend:** Vanilla HTML5 + CSS3 + ES5-compatible JavaScript (`src/index.html` — 1,113 lines; `src/app.js` — 1,038 lines). No bundler, no TypeScript, no React/React Native yet.
- **Backend / Database / Signalling:** None. Uses browser `BroadcastChannel` (same-browser tabs only) and `localStorage` for preferences.
- **Speech & Vision:** Browser `Web Speech API` (`SpeechRecognition` + `SpeechSynthesis`), MediaPipe Hands (`@mediapipe/tasks-vision@0.10.14` WASM via CDN) with a finger-extension heuristic, 12 validated ISL gloss cards, 24-pair local Hindi↔English phrasebook, and a rule-based Text→ISL glossifier + animated visual sign card player.
- **Deployment:** `Dockerfile` (`nginx:alpine`), `docker-compose.yml` (port `8080`), `.github/workflows/pages.yml`, and live `gh-pages` deployment at `https://harsh-18.github.io/Sanket/`.
- **Tests:** Syntax check (`node --check src/app.js`) only; no automated unit, E2E, or screen-reader test suite yet.

### 1.2 Functionality Audit Table

| Area | Current State | Classification | Notes |
|---|---|---|---|
| **Accessible Onboarding & Preferences** | Neutral input/output checkboxes, text scale, speech rate, high-contrast, haptics | **Already implemented and working** | Preserve neutral preference model; expand with AAC/Board & Braille-ready flag |
| **Visual Design System** | Dark neon/glassmorphism theme (`#090d16`, cyan/purple glow) | **Implemented but needs redesign** | Must shift to the **light-first `#F8F9FF` / `#FFFFFF` / `#6655D9` / `#20233B`** design system from the 12 UI mockups |
| **Navigation & Home Screen** | Single scrollable page with onboarding-first layout | **Partially implemented** | Needs clean sidebar/bottom-nav (`Home`, `Connect Nearby`, `Live Conversation`, `Sanket Calls`, `Conversations`, `Accessibility`, `Settings`) & Home quick-start cards |
| **Nearby Pairing (QR + Code + Accept)** | Manual room code only; `BroadcastChannel` works only on same device/browser | **Partially implemented** | Needs **QR code generation/scanning**, **expiring pairing tokens**, **mutual connection acceptance**, and **cross-device signalling** (FastAPI + WebSocket/WebRTC) |
| **Live Two-Way Conversation** | Single chat feed + tabs (`Speak`, `Type`, `Sign`) | **Partially implemented** | Needs split **You vs. Partner** view, live speaking/signing indicators, captions toggle, pause/resume, end session |
| **Speech Recognition & TTS** | Browser Web Speech API (Chrome/Edge); 8 Indian language codes | **Implemented but unreliable** | Browser STT varies across iOS/Android/Firefox; needs **BHASHINI backend abstraction** with clearly labelled local/demo fallback |
| **ISL Recognition (Sign → Text)** | MediaPipe Hands + simple finger-extension heuristic + 12 gloss cards | **Partially implemented** | Explicitly keep limited-vocabulary & uncertainty indicator; prepare modular pipeline for ISLRTC/INCLUDE pose models |
| **ISL Visualisation (Text → Sign)** | Rule-based glossifier + 19 animated emoji/CSS sign cards + fingerspelling | **Partially implemented** | Upgrade to clean vector/pose-driven visualiser aligned with light UI & validated lexicon |
| **Android App (Material 3)** | Not present (Web only) | **Not present** | Build with **React Native + Expo + TypeScript** (`apps/mobile` or `mobile/`), Material 3 conventions, TalkBack, permissions |
| **iOS App (iPhone)** | Not present (Web only) | **Not present** | Build with **React Native + Expo + TypeScript** sharing core engine, native iOS navigation, VoiceOver, Dynamic Type, Safe Area |
| **Backend & Signalling (FastAPI + WebRTC)** | Not present | **Not present** | Build lightweight **FastAPI** service for temporary rooms, QR pairing tokens, WebRTC signalling, and BHASHINI proxy (keys server-side only) |
| **Sanket Calls / Assist / Wear / AudioLink** | Documented in `PLAN_OF_ACTION.md` | **Future roadmap** | Architect interfaces cleanly; show "Future / Coming Soon" entry point only without premature implementation |

---

## 2. Competitor Comparison Report

*(Distinguishing shipped capabilities from research/marketing claims; no unverified user numbers claimed.)*

| Product | Platforms | Core Modality | Shipped Capabilities | Gaps / Limitations vs. Sanket | What Sanket Adopts |
|---|---|---|---|---|---|
| **Ava** (`ava.me`) | Web, Desktop, Android, iOS | Speech → Live Captions + TTS | 24/7 live captions, color-coded speaker ID, Ava Voice (TTS), conference overlays, Ava Scribe hybrid | Focused on spoken-language captioning; **no ISL recognition or ISL visual output** | Guest-first session start, speaker labels, live captions toggle, clean fallback |
| **SignAble** (`signable.live`) | Web, Android, iOS | Human VRI / VRS for ISL | On-demand live human ISL interpreters for phone/face-to-face calls across Indian languages | Requires **human interpreter availability & per-minute cost**; not an instant AI nearby bridge | Clear connection flow, reliable two-way call controls, future interpreter escalation hook |
| **SignBridge AI** (`signbridge.co.in`) | Web, Android | AI Sign ↔ Speech/Text (ISL/ASL) | MediaPipe landmark tracking + LSTM, offline emergency phrases, SOS alerts | Web/Android focus; **no iOS native app**, no BHASHINI multi-language backend | On-device MediaPipe landmarks, limited-vocabulary honesty, confidence & correction |
| **Bitsign** (`bitsign.ai`) | iOS, iPadOS, Android (Early Access) | Polylingual neural Sign ↔ Speech | Mobile-first two-way translation with signing avatar (primarily ASL/early access) | **Early access / ASL-first**; not tailored to Indian languages or BHASHINI | Low-latency 2-way pipeline targeting hands + pose + non-manual markers |
| **Talksign** (`talksign.co`) | Web / API | Edge landmark + foundation models | Browser-side 3D landmark extraction for privacy, fast isolated sign recognition | Commercial/proprietary API; ASL-centric | Edge landmark extraction for privacy before server inference; modular APIs |
| **Signflo** (`signflo.ai`) | Web / SaaS | Speech → 3D Signing Avatar | Virtual signer overlay for meetings/websites | Primarily 1-way avatar SaaS; commercial/ASL-oriented | Clear separation of Text-to-Sign vs. Sign-to-Text pipelines |
| **BhashaSetu** (`bhashasetuisl.in`) | Web / Research | Regional Indian languages → ISL | Multimodal regional text/voice to ISL gloss/animation prototypes | Research/prototype stage; lacks unified 2-device nearby pairing + iOS/Android | India-first regional language + ISL focus |
| **sign.mt** (`sign.mt`) | Web (Open Source) | Multilingual bidirectional sign MT | Open-source text→gloss→pose pipeline, offline-capable web client, pose visualiser | Research-grade pose output; not a dedicated 2-device nearby Indian UX | Open-source pose-based rendering concepts & modular gloss-to-pose architecture |

### Sanket's Differentiation
**Two devices. Different communication preferences. One shared real-time conversation.**  
Unlike caption-only apps (Ava), human-only relay (SignAble), or ASL-centric tools (Talksign/Signflo), Sanket is **India-first, guest-first, nearby-first**, combining **BHASHINI-ready Indian language speech/translation**, **on-device ISL landmarks + validated glosses**, and **adaptive per-participant UIs** across **Web, Android, and iOS**.

---

## 3. Prioritised Implementation Plan

Following Part 19 strictly:

1. **Stage 1 (Done):** Repository audit, gap analysis, and competitor comparison report (`docs/AUDIT_AND_IMPLEMENTATION_PLAN.md`).
2. **Stage 2 — Shared Design System & Packages:**
   - Create `packages/shared/` (TypeScript types, design tokens `#F8F9FF` / `#6655D9` / `#20233B`, ISL gloss lexicon, text-to-ISL glossifier, communication state contracts) usable by Web, Android, iOS, and Docs.
3. **Stage 3 — Web Application Redesign (Light-First, Two-Way Nearby MVP):**
   - Redesign `src/index.html` & `src/app.js` to match the light-first `#F8F9FF` / `#FFFFFF` / `#6655D9` design language from the 12 mockups:
     - Clean left sidebar + mobile bottom navigation (`Home`, `Connect Nearby`, `Live Conversation`, `Sanket Calls (Soon)`, `Conversations`, `Accessibility`, `Settings`).
     - **Home** with immediate *Connect Nearby* / *Join with Code* / *Preferences* actions.
     - **Connect Nearby** with QR code generation, pairing code entry, expiring token display, and mutual connection acceptance.
     - **Live Conversation** split workspace (*You* vs. *Partner*), speaking/signing indicators, live captions toggle, pause/resume, end session, and ISL visualiser.
4. **Stage 4 & 5 — Dedicated Android & iOS Apps (React Native + Expo + TypeScript):**
   - Scaffold `mobile/` with Expo + TypeScript (`app.json` configured for latest stable Android & iOS targets), Material Design 3 conventions on Android, native iOS Safe Area / VoiceOver / Dynamic Type conventions on iOS, and full screen parity (*Splash, Onboarding, Preferences, Home, Connect Nearby + QR Scanner, Live Conversation, Accessibility, Privacy, Settings, Sanket Calls preview*).
5. **Stage 6 — Backend & Real-Time Signalling (`backend/`):**
   - FastAPI + WebSocket signalling server for cross-device Nearby QR/code pairing, expiring tokens, mutual acceptance, WebRTC offer/answer/ICE relay, and **BHASHINI ULCA proxy** (with server-side env vars & `"key not set"` demo fallback), wired into `docker-compose.yml` so `docker compose up` starts everything with zero secret keys.
6. **Stage 7 & 8 — Testing, Docs & Deliverables:**
   - Automated tests (backend API/WebSocket tests, shared engine unit tests), accessibility audit, compatibility matrix, `.env.example`, and complete setup/build guides.
