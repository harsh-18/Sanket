# Project Sanket — Dataset Register & Attribution

In accordance with open-source licensing and ethical AI provenance standards, all datasets referenced or used in Project Sanket are documented below.

---

## 1. Indian Sign Language Dataset (`ISL/data` & `src/assets/isl/`)

- **Citation:** Waghmare, Prachi; Deshpande, Ashwini (2024), *"Indian Sign Language Video and Text dataset for sentences (ISLVT)"*, Mendeley Data, V1.
- **DOI:** `10.17632/98mzk82wbb.1`
- **Coverage Integrated:** 35 static character/digit classes (`1`–`9`, `A`–`Z`).
- **Preprocessing & Usage in Prototype:**
  - The full raw image corpus (`ISL/data/`, ~42,000 JPG frames) is excluded from Git via `.gitignore` to keep the repository lightweight.
  - One representative reference frame per class (`src/assets/isl/1.jpg` … `Z.jpg`, 35 files, ~229 KB total) is bundled for **real-time visual ISL flashcard playback** in `src/app.js`, with SVG schematic fallback if offline/unavailable.
- **Attribution:** Displayed directly inside the Sanket Live Conversation ISL player (`ISLVT — Waghmare & Deshpande, 2024, doi:10.17632/98mzk82wbb.1`).

---

## 2. Planned / Referenced Datasets (Not Bundled)

| Dataset | Creators / Source | Licence | Intended Future Role |
|---|---|---|---|
| **AI4Bharat INCLUDE** | IIT Madras / AI4Bharat (`ai4bharat/INCLUDE`) | MIT (code/landmarks) | Isolated word-level ISL temporal recognition (MediaPipe Holistic + LSTM/ST-GCN) |
| **ISLRTC Dictionary** | Indian Sign Language Research and Training Centre | Public educational reference | Validated sentence-level signer video clips & Hindi/regional ISL lexicon |
| **ISL Fingerspelling** | Community / Academic (`kirandevraj.github.io/ISL-Fingerspelling/`) | Academic / Open | Expanding static & dynamic manual alphabet coverage |

> **Regional & Linguistic Note:** Hindi and other Indian-language ISL word/akshar mappings currently use our curated 27-word lexicon + 31-akshar Devanagari cue fallback while regional ISL datasets are evaluated and verified with fluent Deaf signers.
