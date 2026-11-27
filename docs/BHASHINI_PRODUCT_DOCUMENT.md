# Project Sanket — Product Design Requirement Document (PRD) & User Manual

**Prepared for:** Digital India BHASHINI Division (ULCA API Onboarding)  
**Product Name:** Project Sanket  
**Tagline:** *Different ways to communicate. One shared conversation.*  
**Version:** 1.0 (Prototype / Hackathon Build)  
**Live Deployed Product:** https://harsh-18.github.io/Sanket/  
**GitHub Release:** https://github.com/harsh-18/Sanket/releases/tag/v1.0.0-alpha  
**Repository:** `https://github.com/harsh-18/Sanket`  
**Category:** Assistive Technology / Public Digital Accessibility / Multilingual Communication

---

## 1. Executive Summary

**Project Sanket** is an AI-powered, accessible, multimodal communication platform designed to enable real-time, two-way conversations between people who communicate differently — including Deaf and hard-of-hearing individuals (Indian Sign Language / text), blind and low-vision individuals (screen-reader / audio-first), people with speech disabilities, and speakers of diverse Indian languages.

Instead of forcing every participant to use the same communication channel, Sanket adapts to each user's preferred input and output modalities within a single shared session.

### Why BHASHINI?
Browser-native speech APIs (`Web Speech API` / `SpeechSynthesis`) have limited support for Indian accents, code-mixed Hindi-English speech, and regional Indian languages, and vary widely across Android/iOS browsers. Integrating **BHASHINI (ULCA ASR, NMT, and TTS)** provides:
- High-accuracy **Indian-accented ASR** for noisy real-world environments (hospitals, streets, delivery calls).
- **Neural Machine Translation (NMT)** across scheduled Indian languages beyond our initial 24-pair prototype phrasebook.
- **Natural Indian-language TTS** so Deaf/non-speaking users' ISL or text replies are spoken clearly to hearing or blind participants.

---

## 2. Target Users & Real-World Scenarios

| Scenario | Participant A | Participant B | How Sanket + BHASHINI Bridges the Gap |
|---|---|---|---|
| **Hearing ↔ Deaf** | Speaks Hindi / regional language | Signs ISL / reads text | BHASHINI ASR transcribes speech → NMT translates if needed → displayed as high-contrast text + ISL gloss/reference; B's ISL gloss/text → BHASHINI TTS speaks to A. |
| **Hearing ↔ Blind** | Speaks or types | Listens via audio | Messages delivered via BHASHINI TTS with configurable speech rate; B replies by voice via BHASHINI ASR. |
| **Deaf ↔ Blind** | Signs ISL / taps gloss cards | Speaks & listens | A's sign/text → BHASHINI TTS audio for B; B's speech → BHASHINI ASR text + ISL output for A. |
| **Multilingual Everyday** | Speaks Language X | Reads/hears Language Y | Real-time BHASHINI ASR → NMT → TTS pipeline. |

### Priority Deployment Domains (India)
1. **Healthcare (OPD / Clinic Desks):** Patient–doctor consultations without requiring a human interpreter.
2. **Banking & Public Services (KYC / UPI / Government Counters):** Accessible counter communication.
3. **Last-Mile Logistics & Delivery Calls:** Assisting Deaf/hard-of-hearing users during delivery partner calls (e.g., Zomato/Swiggy).
4. **Education & Workplace Collaboration:** Inclusive classroom and team communication.

---

## 3. System Architecture

```text
+-------------------------------------------------------------------+
|          Sanket Clients (Web PWA + Expo Android & iOS)            |
|  - Light-First Accessible UI (#F8F9FF / #6655D9, WCAG 2.2 AA/AAA) |
|  - Connect Nearby: QR Code & Expiring Pairing Token + Mutual Accept|
|  - MediaPipe Handshape Camera + 12 Validated ISL Gloss Cards      |
|  - Real-Time ISL Visualiser (35 ISLVT A-Z/1-9 + 40 Hindi ISL imgs)|
+---------------------------------+---------------------------------+
                                  |
         +------------------------+------------------------+
         | (FastAPI Gateway: /api/bhashini/translate)      | (Zero-Key Local Fallback)
         v                                                 v
+-----------------------------------------+   +-----------------------------+
|         BHASHINI ULCA API Pipeline      |   |   Local Browser Fallback    |
|  1. ASR  (Speech -> Transcript)         |   |  - Web Speech API (STT/TTS) |
|  2. NMT  (Hindi <-> English & Regional) |   |  - 24-Pair Local Phrasebook |
|  3. TTS  (Translated Text -> Audio)     |   |  - On-Device Hand Landmarks |
+-----------------------------------------+   +-----------------------------+
```

### Key Architectural Principles
1. **Modality Independence:** Input and output preferences are decoupled per participant.
2. **Graceful Degradation:** If BHASHINI API credentials are not configured or the user is offline, Sanket automatically falls back to browser Web Speech APIs and the local phrasebook without blocking the main UI.
3. **Confidence-Aware Interpretation:** Low-confidence transcriptions trigger a confirmation prompt rather than silently sending inaccurate text.

---

## 4. Product Design Requirements (PRD)

### 4.1 Functional Requirements
| ID | Requirement | Description |
|---|---|---|
| **FR-1** | **Accessible Onboarding** | Users select their input mode (Voice, ISL Gloss/Camera, Text/Switch), output mode (Audio TTS, Large Text, ISL Visual, Haptic), preferred language, text scale, and speech rate. |
| **FR-2** | **Session Pairing** | Users can create or join a conversation room via a short alphanumeric room code (e.g., `SANKET-42`). |
| **FR-3** | **BHASHINI ASR Integration** | Capture microphone audio and transcribe Hindi, English, and supported Indian languages with confidence metadata. |
| **FR-4** | **BHASHINI NMT Integration** | Translate messages between the sender's language and the recipient's preferred language. |
| **FR-5** | **BHASHINI TTS Integration** | Synthesize natural spoken audio for recipients who prefer audio output, with adjustable playback rate. |
| **FR-6** | **ISL Gloss & Camera Input** | Provide 12 validated ISL gloss cards for rapid one-tap communication plus experimental MediaPipe handshape landmark detection. |
| **FR-7** | **Voice-First Navigation** | Support voice commands (`send`, `type`, `sign`, `repeat`, `help`, `leave` in Hindi and English) for hands-free / low-vision operation. |
| **FR-8** | **Transcript & Accuracy Lab** | Allow users to export conversation transcripts (`.txt`) and benchmark Word Error Rate (WER) via Levenshtein distance. |

### 4.2 Non-Functional Requirements
- **Accessibility:** Compliant with **WCAG 2.2 AAA** contrast modes, `aria-live` polite/assertive announcements, keyboard shortcuts (`Alt+M`, `Alt+S`), skip links, and `prefers-reduced-motion` support.
- **Latency Target:** End-to-end ASR + NMT + TTS turnaround under 1.5 seconds on 4G mobile networks.
- **Privacy & Data Handling:** Audio streams and transcripts are processed ephemerally for real-time conversation delivery. No biometric voiceprints or camera frames are stored on external servers.
- **Cross-Platform Responsiveness:** Fluid layout for Desktop Web, Android Chrome, and iOS Safari with bottom thumb-zone navigation on mobile.

---

## 5. User Manual

### 5.1 Accessing & Launching Sanket
- **Web / Mobile Browser:** Open the hosted Sanket URL (or `http://localhost:8080` via `docker compose up --build`) in Chrome or Edge.
- **Permissions:** Grant **Microphone** and **Camera** permissions when prompted (camera is optional if using Voice, Text, or ISL Gloss Cards).

### 5.2 Step 1 — Configure Preferences (Onboarding)
1. Choose your **Input Method**: *Voice*, *Sign Language (ISL)*, or *Text / Assistive Switch*.
2. Choose your **Output Method**: *Spoken Audio*, *Large Text*, *ISL Visuals*, or *Haptic Alerts*.
3. Adjust **Text Size**, **Speech Rate**, and toggle **High-Contrast Mode** if needed.
4. Click **Start / Enter Room**.

### 5.3 Step 2 — Join or Create a Conversation Room
1. Enter a shared **Room Code** (or generate one) and click **Join Room**.
2. Share the room code with the second participant so each device/tab receives messages in its own chosen format.

### 5.4 Step 3 — Sending & Receiving Messages
- **Speaking:** Tap the **Mic** button (or press `Alt+M`) and speak naturally in Hindi or English. Review the live transcript and tap **Send** (or `Alt+S`).
- **Signing / ISL Glosses:** Tap any of the **12 ISL Gloss Cards** (e.g., *Hello*, *Help*, *Water*, *Thank You*, *Doctor*) or open the **Handshape Camera** to detect supported signs.
- **Typing:** Type in the message box and press **Send**.
- **Receiving:** Incoming messages are automatically rendered in your selected output format (spoken aloud via TTS, displayed as large captions, and/or matched to ISL gloss descriptions).

### 5.5 Step 4 — Export & Accuracy Benchmarking
- Use **Export Transcript** to download the session log as a `.txt` file.
- Open the **Accuracy Lab** section to measure recognition accuracy (WER) against reference sentences.

---

## 6. Expected BHASHINI API Usage Profile

- **Services Requested:** ULCA Pipeline Search & Compute (`asr`, `translation`, `tts`)
- **Initial Languages:** Hindi (`hi`), English (`en`), with planned expansion to Tamil (`ta`), Telugu (`te`), Marathi (`mr`), and Bengali (`bn`).
- **Estimated Prototype Volume:** ~500–2,000 short utterances/day during pilot testing and accessibility evaluation (typical utterance duration: 2–6 seconds).
- **Authentication Handling:** `userID` and `ulcaApiKey` / inference `Authorization` keys are stored strictly in server-side environment variables or user-provided session configuration — never committed to source control.
