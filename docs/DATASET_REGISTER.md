# Project Sanket — Dataset Register & Attribution

In accordance with open-source licensing and ethical AI provenance standards, **only datasets whose data is actually used in Project Sanket are attributed below.**

---

## 1. English Letters & Digits (`src/assets/isl/` — `1`–`9`, `A`–`Z`)

- **Dataset:** Indian Sign Language Video and Text dataset for sentences (ISLVT)
- **Authors / Creators:** Waghmare, Prachi; Deshpande, Ashwini (2024)
- **Source / DOI:** Mendeley Data, V1 — `doi:10.17632/98mzk82wbb.1`
- **Data Used in Sanket:** 35 static character/digit classes (`1`–`9`, `A`–`Z`) from `ISL/data/`.
- **Preprocessing & Usage:**
  - The full raw training corpus (`/ISL/`) is excluded from Git via `.gitignore`.
  - One representative reference frame per class (`src/assets/isl/1.jpg` … `Z.jpg`, 35 files, ~229 KB total) is bundled for real-time visual ISL flashcard playback in `src/app.js`, with SVG schematic fallback.

---

## 2. Hindi Devanagari Sign Language (`src/assets/isl-hi/` — 40 Classes)

- **Dataset:** Indian Sign Language - Hindi
- **Creator / Uploader:** Krish Bhagat
- **Source URL:** `https://www.kaggle.com/datasets/krishbhagat/indian-sign-language-hindi`
- **Data Used in Sanket:** 40 Devanagari vowel, consonant, and conjunct classes (`अ`, `आ`, `इ`, `ई`, `उ`, `ए`, `ऐ`, `ओ`, `क`, `क्ष`, `ख`, `ग`, `घ`, `च`, `छ`, `ज`, `ज्ञ`, `झ`, `ट`, `ठ`, `ड`, `ढ`, `ण`, `त`, `थ`, `द`, `ध`, `न`, `प`, `फ`, `ब`, `भ`, `म`, `य`, `र`, `ल`, `व`, `श`, `स`, `ह`) from `Hindi-ISL/HindiSignImages48x48/`.
- **Preprocessing & Usage:**
  - The full raw training corpus (`/Hindi-ISL/`) is excluded from Git via `.gitignore`.
  - One representative 48×48 reference frame per class (`src/assets/isl-hi/uXXXX.jpg`, 40 files, ~173 KB total) is bundled for real-time Hindi ISL flashcard playback in `src/app.js`.
