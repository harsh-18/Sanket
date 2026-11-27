# Project Sanket — Hackathon Pitch Deck

**Scaler × Wispr Flow Hackathon: India Runs on Voice 2026**  
**Tagline:** *Different ways to communicate. One shared conversation.*  
**Live Prototype:** https://harsh-18.github.io/Sanket/  
**GitHub Repository:** https://github.com/harsh-18/Sanket

---

## 1. Problem & Solution

### Who Has the Problem?
Most communication apps assume every user can simultaneously **see, hear, speak, read, and type**. That assumption locks out millions of people from everyday conversations:
- A **Deaf person** signing Indian Sign Language (ISL) cannot directly converse with a **hearing person** speaking Hindi at a hospital counter, bank desk, or on a delivery phone call.
- A **blind or low-vision person** cannot read visual-only captions or silent sign language.
- A **Deaf person and a blind person** have almost no accessible digital bridge to talk to each other without a human interpreter.
- **Multilingual speakers** across Indian languages struggle with noisy, English-centric voice tools.

### How Project Sanket Solves It
Sanket decouples **how you send** from **how the other person receives** inside one shared conversation room:
1. **Input Layer:** Each participant chooses their own input — **Voice** (Hindi/English speech recognition + voice commands), **Indian Sign Language** (12 validated ISL gloss cards + experimental on-device MediaPipe handshape camera), or **Text / Assistive Switch**.
2. **Interpretation Layer:** Transcribes speech with confidence scoring, translates between Hindi and English (24-pair local phrasebook in prototype; BHASHINI ULCA NMT in production), and flags low-confidence inputs for confirmation instead of guessing.
3. **Output Layer:** Delivers each message in the *recipient's* preferred format — **Spoken Audio (TTS with rate control)**, **High-Contrast Large Text (WCAG 2.2 AAA)**, **ISL Gloss / Visual Reference**, and **Haptic Alerts**.

---

## 2. Who It Is For & Addressable Scale

### Target Users
- **Deaf & Hard-of-Hearing Individuals:** Instant speech-to-text captions, ISL gloss replies converted to spoken audio, and visual/haptic notifications.
- **Blind & Low-Vision Individuals:** Audio-first delivery via TTS, full keyboard/screen-reader (`aria-live`) navigation, and voice commands (`send`, `type`, `sign`, `repeat`, `help`, `leave` in Hindi & English).
- **Speech-Impaired / Non-Speaking Users:** One-tap validated ISL/phrase cards that speak aloud for the listener.
- **Everyday Service Providers & Families:** Doctors, bank/KYC staff, teachers, and delivery partners (Zomato/Swiggy) communicating with accessibility-first users without needing special hardware.

### Market & Impact Scale
- **India:** Over **63 million** people with significant auditory impairment (WHO / MoSJE estimates) and **4.95 million+** blind / **20+ million** visually impaired citizens, plus **22 scheduled languages** across 1.4B+ people.
- **Global:** **430+ million** people with disabling hearing loss and **285+ million** with visual impairment (WHO).
- **Initial Beachhead:** Urban Indian clinics/OPD desks, inclusive schools/colleges, and last-mile delivery/logistics call handling.

---

## 3. Dependencies & Fallback Plan (What Happens If Services Get Costly or Fail)

| Dependency | Role in Sanket | Cost / Failure Risk | Built-In Fallback & Mitigation |
|---|---|---|---|
| **Web Speech API & SpeechSynthesis** | Browser STT & TTS (prototype) | Varies by browser; requires Chrome/Edge for STT | App starts with **zero API keys**; text + 12 ISL gloss cards + TTS remain usable offline/cross-browser. |
| **MediaPipe Hands (WASM)** | On-device handshape landmarking | Requires camera permission & decent lighting | Runs **100% client-side** (zero server cost). If camera is unavailable, users tap the **12 validated ISL gloss cards**. |
| **BHASHINI (Govt. of India ULCA)** | Planned Indian-language ASR, NMT, TTS | API quota limits or network downtime | **Zero-key graceful degradation:** automatically falls back to browser Web Speech + local phrasebook; self-hostable open-source **Whisper + IndicTrans2 + Coqui/Piper TTS** if cloud APIs become costly. |
| **BroadcastChannel / Supabase Realtime** | Room message sync | Cloud DB cost at scale | Prototype uses **browser-native BroadcastChannel** (zero cost). Production uses Supabase Realtime with stateless ephemeral messages (no heavy media storage). |
| **Docker / Nginx Static Hosting** | App delivery | Hosting cost | Lightweight ~40 MB `nginx:alpine` container; runs locally via `docker compose up` or free on GitHub Pages. |

---

## 4. Launch Plan: First Users & Growth

1. **Phase 1 — Campus & NGO Pilot (Weeks 1–4):**
   - Partner with local Deaf/Blind associations, inclusive university cells, and 2–3 clinic reception desks to test real Hindi/English/ISL conversations and collect WER & usability feedback.
2. **Phase 2 — BHASHINI & Cross-Device Launch (Months 2–3):**
   - Integrate approved **BHASHINI ULCA** ASR/NMT/TTS APIs for regional Indian languages (Hindi, Tamil, Telugu, Marathi, Bengali) and enable cross-device rooms via Supabase Realtime.
3. **Phase 3 — Delivery & Phone-Call Accessibility Layer (Months 4–6):**
   - Ship Android companion features using `CallScreeningService` / Accessibility APIs so Deaf users can handle real-time delivery partner calls (e.g., Zomato/Swiggy) seamlessly, and expand via B2B/public-sector counter deployments (hospitals, banks, citizen service centers).

---

## 5. Code & Architecture Documentation

- **`src/index.html` & `src/app.js`:** Light-first (`#F8F9FF` / `#6655D9`) accessible Web App with Connect Nearby QR/code pairing, split two-way Live Conversation workspace, Hindi & English speech input/TTS, MediaPipe handshape camera, and real-time ISL Visualiser powered by **ISLVT** (`doi:10.17632/98mzk82wbb.1`, 35 classes) and **Indian Sign Language - Hindi** (Krish Bhagat, Kaggle, 40 Devanagari classes).
- **`backend/main.py` & `backend/test_main.py`:** FastAPI server providing temporary Nearby rooms, cross-device WebSocket relay (`/ws/{room}`), and a zero-key BHASHINI ULCA proxy (`/api/bhashini/translate` returning `"key_not_set"` fallback when env vars are unset).
- **`mobile/` & `packages/shared/`:** Dedicated Android (Material 3) & iOS (Safe Area / VoiceOver) Expo React Native apps sharing TypeScript design tokens, communication contracts, and ISL lexicon.
- **`Dockerfile` & `docker-compose.yml`:** One-command startup (`docker compose up --build`) serving the full app on `http://localhost:8080` with zero secret keys required.
