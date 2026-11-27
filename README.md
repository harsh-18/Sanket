# Sanket — Different ways to communicate. One shared conversation.

**An AI-powered, accessible, multimodal communication platform.**

People communicate in different ways. Some speak and hear. Some communicate through sign language. Some rely on text. Some use screen readers, Braille or other assistive technologies. These differences should not prevent two people from having a conversation.

Sanket allows people to communicate through their preferred methods, with AI helping interpret and deliver messages in a format the other participant can understand.

---

## The Problem

Most communication applications assume every user can see, hear, speak, read and type. This creates barriers for people who communicate through sign language, rely on audio, have speech disabilities, or use alternative communication methods.

Consider a Deaf person and a blind person trying to have a conversation. Or a hearing person speaking Hindi to a Deaf person who signs in ISL. Or a delivery partner calling someone with hearing loss. Today, each of these situations requires a human intermediary.

Sanket removes that dependency.

---

## How It Works

The application has three layers. Each participant independently selects their own input and output preferences.

### A. Input Layer — How people send messages
- Speech (Hindi, English)
- Indian Sign Language (validated gloss vocabulary + experimental handshape camera)
- Text / keyboard / assistive switch input

### B. Interpretation Layer — AI processing
- Speech recognition with confidence scoring
- Language identification
- Translation (phrasebook in prototype; API in production)
- Uncertainty detection → confirmation step instead of guessing

### C. Output Layer — How people receive messages
- Spoken audio (text-to-speech with rate control)
- Text (large, screen-reader compatible)
- ISL video output (validated reference clips)
- Haptic / visual notifications

**Example:** Person A speaks Hindi → Sanket transcribes it → Person B (Deaf) sees the text and an ISL video clip. Person B taps an ISL gloss card → Sanket delivers it as spoken audio to Person A.

---

## Key Scenarios

| Scenario | Person A | Person B | How Sanket bridges the gap |
|---|---|---|---|
| Hearing ↔ Deaf | Speaks Hindi | Signs ISL | Speech→text + ISL video output; Gloss→speech |
| Hearing ↔ Blind | Speaks or types | Listens via audio | Messages delivered as speech; screen-reader compatible |
| Deaf ↔ Blind | Signs ISL | Speaks and listens | Sign→text→speech; Speech→text + ISL output |
| Deaf ↔ Deaf | Both sign ISL | Both sign ISL | Text as additional channel; sign vocabulary assistance |
| Everyday use | Any language | Any language | Multilingual speech, transcription, translation |

---

## Current Build Status

This is a **browser-based prototype** (`src/index.html` + `src/app.js`). No build step required.

### ✅ Working

| Feature | Implementation |
|---|---|
| Accessible onboarding | Combinable input/output preferences, text-size slider, speech-rate control, high-contrast toggle, haptic toggle |
| Room create / join | Session-code pairing; real-time sync via BroadcastChannel (same browser) |
| Speech → text | Web Speech API (Chrome/Edge), Hindi + English, confidence display |
| Text → speech | Web Speech Synthesis, rate control, voice auto-selection |
| ISL gloss vocabulary | 12 validated phrases with Hindi, English and sign descriptions |
| Handshape camera | MediaPipe hand landmarks + rule-based finger classifier (experimental) |
| Phrasebook translation | 24 Hindi↔English phrase pairs |
| Accuracy lab | Per-sentence WER measurement with Levenshtein distance |
| Recipient-specific output | Each participant receives messages in their chosen format |
| Voice commands | Hindi + English commands for send, type, sign, repeat, help, leave |
| Transcript export | Download conversation as `.txt` |
| Accessibility | Skip link, ARIA live regions, role attributes, reduced-motion support |

### 🔧 In Progress / Planned

| Feature | Status |
|---|---|
| Cross-device messaging (Supabase Realtime) | Not yet wired — highest priority |
| ISL reference video clips for gloss cards | Assets needed |
| FastAPI backend | Not yet created |
| Google Cloud STT / TTS | Not yet integrated (using browser APIs) |
| Real ISL sign recognition (temporal ML model) | Research phase |
| Translation API / LLM | Phrasebook only; API integration planned |
| React Native / Expo app | Deferred; web app works on Android Chrome |

### ❌ Explicitly Out of Scope (v1)

Continuous ISL translation · Signing avatars · All 22 Indian languages · Braille output · Emotion detection · Video calling · Social networking

---

## Project Structure & Code Documentation

```text
Sanket/
├── README.md                 # Project overview, run guide, and file documentation
├── LICENSE                   # Open-source license
├── Dockerfile                # Lightweight nginx:alpine container serving src/
├── docker-compose.yml        # One-command startup (http://localhost:8080, zero keys needed)
├── .dockerignore             # Excludes docs/git metadata from Docker build context
├── .gitignore                # Prevents committing .env, keys, secrets, or temp artifacts
├── src/
│   ├── index.html            # Accessible UI markup, 2026 responsive CSS, onboarding, room, ISL cards, Accuracy Lab
│   └── app.js                # Core JS engine: Web Speech STT/TTS, voice commands, BroadcastChannel sync,
│                             # MediaPipe handshape classifier, 24-pair phrasebook, Levenshtein WER lab, export
├── assets/
│   └── README.md             # Placeholder for ISL reference videos, icons, and fonts
├── docs/
│   ├── README.md                          # Documentation index
│   ├── PLAN_OF_ACTION.md                  # Complete project plan, hackathon strategy, team roles
│   ├── DESIGN_SYSTEM_AND_INSPIRATION.md   # 2026 UI/UX study & cross-platform accessibility spec
│   ├── BHASHINI_PRODUCT_DOCUMENT.md       # PRD & User Manual for BHASHINI (ULCA) API onboarding
│   └── SANKET_PITCH_DECK.md               # Hackathon pitch deck (Problem, Users, Dependencies, Launch Plan)
└── .github/
    └── workflows/
        └── pages.yml         # GitHub Pages deployment workflow
```

---

## Run Locally

No build step or secret API keys are needed for this prototype.

### Option 1: Docker (One Command)

```bash
docker compose up --build
```

Open `http://localhost:8080` in **Chrome or Edge**.

### Option 2: Local Static Server

1. **Serve over HTTPS or localhost** (required for microphone/camera access):
   ```bash
   # Option A: Python
   python -m http.server 8000 --directory src
   
   # Option B: Node
   npx serve src
   ```
2. Open `http://localhost:8000` in **Chrome or Edge**.
3. Grant microphone and camera permissions when prompted.

> **Note:** Opening `index.html` as a `file://` URL will block microphone access. Speech output still works. All core features run directly in the browser without requiring any external API keys.

---

## GitHub Pages Deployment

1. Push the repository to GitHub.
2. Go to **Settings → Pages** and set the source to **GitHub Actions**.
3. The included `.github/workflows/pages.yml` publishes `src/index.html` and `src/app.js` automatically.
4. The published URL will appear in the Pages settings and workflow deployment summary.

---

## Technology Stack

| Layer | Current (Prototype) | Production Target |
|---|---|---|
| **Frontend** | Vanilla HTML + CSS + JS | React Native, Expo, TypeScript, Expo Router |
| **Speech input** | Web Speech API | Google Cloud Speech-to-Text (hi-IN, en-IN) |
| **Speech output** | Web Speech Synthesis | Google Cloud Text-to-Speech + native Android TTS fallback |
| **Sign language** | MediaPipe hand landmarks + heuristic classifier; gloss cards | MediaPipe + PyTorch temporal model; validated ISL video output |
| **Translation** | Hardcoded phrasebook (24 pairs) | Translation API or LLM for contextual processing |
| **Real-time** | BroadcastChannel (same browser) | Supabase Realtime (cross-device) |
| **Backend** | None | FastAPI (Python) on Google Cloud Run |
| **Database** | localStorage | Supabase (PostgreSQL + Auth + Realtime) |
| **Deployment** | GitHub Pages | Cloud Run + Supabase + Expo EAS |

---

## Hackathon

**Scaler × Wispr Flow: India Runs on Voice 2026**

- **Track:** Everyday Access
- **Voice-first:** Speech is a primary input/output method; the app is navigable without a keyboard.
- **Voice-led development:** Development instructions spoken via Wispr Flow.

See [`docs/PLAN_OF_ACTION.md`](docs/PLAN_OF_ACTION.md) for the complete project plan, team responsibilities, hackathon strategy, and development timeline.

---

## Future Vision

Beyond the hackathon, Sanket aims to become an **accessibility layer for all phone communication**:

- **App integration:** When a hearing-impaired user receives a phone call (e.g., from a delivery partner on Zomato or Swiggy), Sanket intercepts the audio, converts the caller's speech to text and ISL in real time, and translates the user's sign-language reply back to speech for the caller.
- **System-level accessibility:** Integration with Android's Accessibility Service API and `CallScreeningService` to function across all calling apps.
- **Domains:** Healthcare, education, public services, workplaces, transport, emergency assistance.
- **Languages:** Regional Indian languages added after validating each STT/translation/TTS pipeline.
- **DeafBlind communication:** Compatible assistive technology support.

---

## Team

| Role | Responsibilities |
|---|---|
| **Member 1 — Mobile & Accessibility** | UI, onboarding, preferences, conversation screens, TalkBack, Android builds |
| **Member 2 — Backend & Speech AI** | FastAPI, Supabase, auth, sessions, real-time messaging, STT, TTS, translation, deployment |
| **Member 3 — Computer Vision & ISL** | ISL research, datasets, MediaPipe, OpenCV, PyTorch, sign classification, validated sign output |
| **All** | Product decisions, testing, accessibility feedback, integration, documentation, pitch, demo |

---

## License

See [LICENSE](LICENSE).
