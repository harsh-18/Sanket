# Project Sanket — Complete Plan of Action

**Scaler × Wispr Flow Hackathon: India Runs on Voice 2026**

> Different ways to communicate. One shared conversation.

---

## Table of Contents

1. [The Idea](#1-the-idea)
2. [Who We Are Building For](#2-who-we-are-building-for)
3. [How the Application Works](#3-how-the-application-works)
4. [Product Features](#4-product-features)
5. [Hackathon Relevance](#5-hackathon-relevance)
6. [Round 1: Warm-Up (5–26 November)](#6-round-1-warm-up)
7. [Round 2: The Build (27–29 November)](#7-round-2-the-build)
8. [Round 3: Finale (13 December)](#8-round-3-finale)
9. [Technology Stack](#9-technology-stack)
10. [Team Responsibilities](#10-team-responsibilities)
11. [Critical Thinking: Risks and Cautions](#11-critical-thinking)
12. [Use Cases and Future Opportunities](#12-use-cases-and-future-opportunities)
13. [What Not to Build in v1](#13-what-not-to-build-in-v1)
14. [Development Timeline](#14-development-timeline)
15. [Success Metrics](#15-success-metrics)
16. [The Final Product Vision](#16-the-final-product-vision)
17. [Future Vision: App Integration](#17-future-vision-app-integration)
18. [Team Principles](#18-team-principles)

---

## 1. The Idea

**Working name:** Project Sanket

**Tagline:** Different ways to communicate. One shared conversation.

We are building an AI-powered, accessible, multimodal communication platform.

The fundamental idea is simple:

People communicate in different ways. Some speak and hear. Some communicate through sign language. Some rely on text. Some use screen readers, Braille or other assistive technologies.

But these differences should not prevent two people from having a conversation.

Today, most communication applications are primarily designed around assumptions that users can see, hear, speak, read and type.

Project Sanket aims to remove those barriers.

It allows people to communicate through their preferred methods, with AI helping interpret and deliver messages in a format that the other participant can understand.

The application does not force everyone to communicate in the same way. It adapts to the individual.

---

## 2. Who We Are Building For

We are not building an application exclusively for Deaf people or blind people. Our target audience is much broader.

### Scenario A: Hearing person ↔ Deaf person

- Person A speaks in Hindi.
- The application converts the speech into text and, where supported, validated Indian Sign Language (ISL) output.
- Person B signs in front of the camera.
- The application interprets the supported sign and delivers speech or text to Person A.

### Scenario B: Hearing person ↔ Blind person

- Person A speaks or types.
- Person B receives the message through audio.
- Person B responds through speech.
- Person A receives the response as speech or text.

### Scenario C: Deaf person ↔ Blind person

This is one of our most important use cases.

- The Deaf participant communicates through sign language.
- The application interprets the supported sign.
- The blind participant receives spoken output.
- The blind participant responds through speech.
- The Deaf participant receives text and validated sign-language output.

### Scenario D: Two Deaf people

- Both participants can use sign language.
- The application can provide text as an additional option.
- Sign-language recognition and sign output can help where the participants use different supported sign-language vocabulary or need assistance.

### Scenario E: Two people with speech disabilities

- Both participants can type or use other supported alternative input methods.
- Messages can be delivered as text, speech or another preferred output.

### Scenario F: Deaf person with low vision ↔ Person with speech disability

The application allows multiple accessibility preferences to be combined rather than forcing users into one disability category.

### Scenario G: Ordinary everyday communication

People without disabilities can also use the application for multilingual speech, transcription, translation and accessible communication.

**This is important. We are building a universal communication platform, not a product that separates people into categories.**

---

## 3. How the Application Works

The application has three main layers.

### A. Input Layer — How people communicate

- Speech
- Indian Sign Language
- Text and typing
- Compatible assistive input methods
- Other supported communication methods in the future

### B. AI and Interpretation Layer

The application processes the input:

- Speech recognition
- Sign-language recognition
- Language identification
- Translation
- Contextual interpretation
- Confidence and uncertainty detection

### C. Output Layer — How people receive messages

- Spoken audio
- Text
- Validated sign-language videos
- Screen-reader output
- Braille-compatible output in future versions
- Visual and tactile notifications

The sender and recipient independently select their preferred input and output methods.

For example, one person may speak Hindi, another may communicate through ISL, and a third may type English and use a screen reader. The same conversation accommodates all three.

---

## 4. Product Features

### Complete Product Vision

1. Personalised accessibility onboarding
2. User profiles and communication preferences
3. QR code or session-code pairing
4. Live conversation between multiple participants
5. Speech-to-text
6. Text-to-speech
7. Hindi and English speech support initially
8. Additional regional Indian languages
9. ISL recognition
10. Validated ISL video output
11. Recipient-specific message formatting
12. Screen-reader compatibility
13. Adjustable text size and contrast
14. Visual and haptic notifications
15. Error correction and confirmation when AI recognition is uncertain

### Hackathon Prototype Scope

We must distinguish between the long-term vision and the actual hackathon prototype. We cannot realistically build unrestricted sign-language translation, all Indian languages, complete Braille support and every accessibility feature in a short hackathon.

We will demonstrate a smaller number of functions properly.

---

## 5. Hackathon Relevance

**Event:** India Runs on Voice

**Central theme:** Building voice-first tools for India.

**Tracks identified by organisers:**
1. Civic services
2. Healthcare
3. Education
4. Small business
5. Everyday access

**Our fit:** Everyday Access — our central problem is communication accessibility and independence.

**Note:** Round 2 gives everyone a common problem statement. We must read that statement carefully and adapt our prototype to it.

### Our product must demonstrate two things:

#### A. Voice-first product experience

Voice is a primary method of using Sanket. Users can navigate, start conversations, speak messages and receive spoken responses without depending entirely on a keyboard.

#### B. Voice-led development

We use Wispr Flow while developing the application. Instead of typing every instruction into ChatGPT, Cursor or VS Code, we speak our instructions through Wispr Flow.

**Examples:**
- Product planning
- Prompt writing
- Coding instructions
- Debugging
- Documentation
- Preparing the pitch

**Important:** Wispr Flow provides voice-led development. It is not an SDK to embed in Sanket. Our application has its own speech-processing technology.

---

## 6. Round 1: Warm-Up

**Period:** 5–26 November

Round 1 has three activities: IDEA, PROMPT, and IMPACT.

We must complete the actual dashboard activities. The following is our proposed content to adapt to their respective submission fields.

### Activity 1: IDEA

**Suggested title:** Project Sanket: Universal Communication Without Barriers

**Suggested description:**

We are building an AI-powered multimodal communication platform that helps people communicate regardless of how they speak, hear, see or express themselves.

Today, communication technology often assumes that everyone can speak, hear, read and see. This creates significant barriers for people who communicate through sign language, rely on audio, have speech disabilities or use alternative communication methods.

Project Sanket aims to bridge these differences by supporting speech, Indian Sign Language, text and accessible output methods.

For example, a hearing person should be able to speak to a Deaf person and have their message delivered through text or validated sign-language output. A Deaf person should be able to sign a message and have it delivered as speech to a blind person.

The application adapts its interface and communication methods to each participant's preferences.

Our objective is to make everyday communication more independent, accessible and inclusive.

### Activity 2: PROMPT

**Suggested development prompt:**

> Act as a senior product architect, accessibility specialist and AI engineer.
>
> Help us design Project Sanket, an Android-first, voice-first, multimodal communication platform.
>
> The application should enable people with different communication requirements to interact through speech, sign language and text.
>
> Design an accessible onboarding experience that asks users how they prefer to communicate, receive information and navigate the application. Do not force users into fixed disability categories.
>
> The application should support:
> - Speech input and output.
> - Hindi and English initially, with regional languages in the architecture.
> - Indian Sign Language as the initial sign language.
> - Text-based communication.
> - Speech-to-text and text-to-speech.
> - Camera-based recognition of a constrained, validated ISL vocabulary.
> - Validated sign-language video output.
> - Multiple participants in a shared conversation.
> - Screen-reader compatibility and accessible interface settings.
> - Confirmation when AI recognition is uncertain.
>
> Recommend an implementable architecture using React Native, Expo, Python, FastAPI, Supabase and suitable AI services.
>
> Prioritise a working prototype over ambitious claims. Identify technical risks, accessibility limitations and privacy requirements.

### Activity 3: IMPACT

**Suggested response:**

Project Sanket aims to reduce communication barriers between people who use different communication methods.

Its potential beneficiaries include Deaf people, blind and visually impaired people, people with speech disabilities, DeafBlind people and individuals who simply prefer alternative communication methods.

The immediate objective is to make everyday conversations more accessible and reduce dependence on intermediaries.

The long-term opportunity includes education, healthcare, public services, workplaces and multilingual communication.

We believe accessibility should be built into the communication experience rather than added as an afterthought.

Our impact will be evaluated through practical measures such as successful conversations, translation accuracy, task completion, user independence and feedback from people with different accessibility requirements.

> **IMPORTANT:** These are proposed drafts. We must follow the exact wording, character limits, activity instructions and submission requirements shown in the official dashboard.

---

## 7. Round 2: The Build

**Period:** 27–29 November

The organisers will release one common problem statement for everyone on 27 November.

We must not blindly submit the entire Sanket vision without checking whether it solves that specific problem.

### Our approach:

**Step 1: Understand the problem statement**
- Who is the target user?
- What is the actual problem?
- What is the expected solution?
- What does the problem statement require?
- What is the most important outcome?

**Step 2: Map Sanket against the challenge**
- Identify which existing capabilities solve the problem directly.
- Remove features that do not contribute to the required outcome.

**Step 3: Select one strong demonstration scenario**

For example: A Hindi-speaking person communicates with a Deaf participant using supported ISL. The application recognises speech, displays the message and provides appropriate sign-language output. The Deaf participant responds through a supported sign, and the application delivers an interpreted response.

**Step 4: Build the working prototype**

Minimum target:
- Accessible onboarding
- User preference selection
- Session creation and joining
- Shared conversation
- Voice input
- Speech-to-text
- Spoken output
- A constrained ISL demonstration
- Recipient-specific output
- Uncertainty handling

**Step 5: Test the entire experience**

Demonstrate an actual conversation rather than just showing screenshots.

**Step 6: Prepare the submission**

Follow the official Round 2 submission format, including any requested:
- Project link
- APK or hosted application
- Source code repository
- Demonstration video
- Project description
- Technical explanation
- Usage instructions

These are items we should prepare, not confirmed mandatory fields until the Round 2 instructions are published.

**Deadline: 29 November.** Aim to finish integration before the final submission hours.

---

## 8. Round 3: Finale

**Date:** 13 December (if shortlisted)

The focus shifts from explaining the idea to proving that it works.

### Demonstration should cover:

1. The real-world communication problem.
2. Why existing interfaces create barriers.
3. How Sanket addresses the problem.
4. A live conversation between participants using different communication methods.
5. How the accessibility interface adapts.
6. The technology behind the product.
7. What we have successfully implemented.
8. What remains under development.
9. The potential impact and future roadmap.

### Deliverables:
- Concise pitch
- Working Android application (or hosted web app)
- Live demonstration
- Recorded backup video

**Do not claim perfect sign-language translation or support for all languages unless demonstrated.**

---

## 9. Technology Stack

### Modular Architecture

We use a modular architecture so that we can expand the product without rewriting it.

### Frontend / Application

| Technology | Purpose |
|---|---|
| **Current prototype:** Vanilla HTML + CSS + JS | Browser-based demo, works on Android Chrome |
| **Production target:** React Native, Expo, TypeScript, Expo Router | Native Android app with camera, mic, local storage |
| Expo Camera | Camera access for sign-language input |
| Expo SQLite, Expo SecureStore | Local preferences and secure credential storage |

### Backend

| Technology | Purpose |
|---|---|
| Python, FastAPI | Session management, communication orchestration, AI processing |
| REST APIs | Standard endpoints for all client operations |
| WebSockets | Real-time message delivery where needed |

### Database and Real-Time

| Technology | Purpose |
|---|---|
| Supabase (PostgreSQL) | Accounts, preferences, sessions, messages |
| Supabase Auth | User authentication |
| Supabase Realtime | Live message delivery across devices |

### AI and Speech

| Technology | Purpose |
|---|---|
| Google Cloud Speech-to-Text | Speech recognition (hi-IN, en-IN) |
| Google Cloud Text-to-Speech | High-quality spoken output |
| Native Android TTS | Offline fallback |
| Translation API or LLM | Contextual language processing |

**Initial spoken languages:** Hindi and English. Additional Indian languages added only after validating their speech recognition, translation and synthesis pipelines.

### Sign-Language Recognition

| Technology | Purpose |
|---|---|
| MediaPipe | Visual hand/body landmark extraction |
| OpenCV | Frame processing |
| PyTorch | Temporal sign-sequence classification |
| NumPy | Numerical processing |
| Validated ISL reference videos | Ground-truth vocabulary |

**Note:** These technologies do not automatically provide complete ISL translation. We need suitable training data, a validated model and review by ISL-fluent people.

### Deployment

| Service | Purpose |
|---|---|
| Google Cloud Run | FastAPI backend hosting |
| Supabase | Database and real-time services |
| GitHub | Source control |
| Expo EAS or equivalent | APK generation |
| GitHub Pages | Prototype hosting (current) |

### AI Architecture: Hybrid Model

**On-device:**
- Accessibility preferences
- Interface adaptation
- Local settings
- Basic text-to-speech fallback
- Local user controls

**Cloud:**
- Speech recognition
- Translation
- Sign recognition (initially)
- Contextual interpretation
- Conversation orchestration

This balances development speed, privacy and model capability.

---

## 10. Team Responsibilities

### Member 1: Mobile Application and Accessibility

- React Native and Expo (or current web UI)
- Onboarding
- User profiles
- Communication preferences
- Pairing and session interface
- Conversation screens
- Camera and microphone permissions
- TalkBack compatibility
- Android builds

### Member 2: Backend and Speech AI

- FastAPI
- Supabase database
- Authentication
- Session management
- Realtime messaging
- Speech-to-text
- Text-to-speech
- Translation
- Cloud deployment

### Member 3: Computer Vision and ISL

- ISL research
- Dataset identification
- MediaPipe
- OpenCV
- PyTorch
- Landmark extraction
- Sign classification
- Confidence estimation
- Validated sign output

### All Three Members

- Product decisions
- Testing
- Accessibility feedback
- Integration
- Documentation
- Pitch preparation
- Final demonstration

**One person must own integration. Everyone should know how to run the complete application, not just their individual module.**

---

## 11. Critical Thinking

These are the most important technical and product risks.

### 1. Sign language is not ordinary spoken language

ISL has its own grammar, vocabulary and linguistic structure. We cannot simply translate English words into hand gestures.

### 2. Sign recognition is difficult

Hand shape alone is insufficient. We may need:
- Hand movements
- Hand positions
- Body posture
- Facial expressions
- Spatial relationships
- Temporal sequences

We should initially support a small, validated vocabulary rather than promise unrestricted translation.

### 3. Accuracy matters more than appearing intelligent

If the application is uncertain about a sign or spoken message, it should ask for clarification. A wrong translation can cause serious misunderstandings, particularly in healthcare, emergencies and public services.

### 4. Emotion recognition must not be invented

We should preserve the actual message and its intended meaning. We must not claim to identify someone's emotions reliably without a validated method.

### 5. Accessibility must be present from onboarding

A blind user should not need assistance just to configure the application. A Deaf user should not have to rely on audio instructions. A person with low vision should be able to adjust the interface.

### 6. Do not assume everyone has the same disability or preferences

Users may combine multiple communication requirements. The application should ask how someone wants to communicate, not force them into a predefined category.

### 7. Privacy and consent

Camera and microphone access must be explicit. We should avoid storing raw video and audio by default. Sensitive conversations must not become training data without appropriate consent.

### 8. Regional language support

Supporting a language in a speech API does not automatically mean we have complete speech recognition, translation and natural speech output. Each language must be tested.

### 9. Accessibility must not depend on the internet

User preferences should remain available locally. Where possible, we should offer fallback methods when the network is unavailable.

### 10. Do not over-engineer

We have limited development time. A working conversation between two or three people is more valuable than ten incomplete features.

---

## 12. Use Cases and Future Opportunities

Our immediate focus is everyday communication. Potential future applications include:

- Hospitals and healthcare centres
- Schools and universities
- Government offices
- Railway stations and airports
- Banks and customer service counters
- Workplaces
- Public information services
- Emergency assistance
- Multilingual conversations
- DeafBlind communication using compatible assistive technologies

**These are future opportunities, not features we claim to have already built.**

---

## 13. What Not to Build in v1

To keep the project realistic, defer:

- All 22 Indian languages
- Every international sign language
- Unrestricted continuous ISL translation
- 3D signing avatars
- Complete Braille conversation support
- Emotion detection
- Video calling infrastructure
- Social networking features
- AI-generated sign gestures

**The first deliverable is a functional communication prototype.**

---

## 14. Development Timeline

### Before 27 November

- [x] Finalise team membership
- [ ] Complete Round 1 activities on the official dashboard
- [x] Set up GitHub
- [x] Create the front-end prototype (HTML/JS)
- [ ] Create the FastAPI backend
- [ ] Configure Supabase (database, auth, realtime)
- [x] Develop onboarding and conversation screens
- [x] Test speech recognition and spoken output (browser APIs)
- [ ] Wire Supabase Realtime for cross-device messaging
- [ ] Record ISL reference videos for gloss vocabulary
- [ ] Research ISL vocabulary and data permissions

### 27 November

- [ ] Analyse the common problem statement
- [ ] Agree on the exact use case
- [ ] Freeze the MVP scope
- [ ] Divide implementation tasks

### 28 November

- [ ] Complete backend integration
- [ ] Wire Google Cloud STT/TTS
- [ ] Test on Android devices (two separate phones)
- [ ] Fix critical issues
- [ ] Prepare demonstration material

### 29 November

- [ ] Final testing
- [ ] Generate APK or confirm hosted URL
- [ ] Record backup demo video
- [ ] Prepare source code and documentation
- [ ] Submit before the deadline

### 13 December

- [ ] If shortlisted, attend the finale and demonstrate the product in person

---

## 15. Success Metrics

We measure actual usability, not the number of AI features.

Our prototype should aim for:

- [ ] Successful session creation and joining (cross-device)
- [ ] Successful speech-to-text for Hindi and English
- [ ] Reliable spoken output
- [ ] Successful delivery of messages to the intended participant
- [ ] Correct recognition of validated sign vocabulary in controlled tests
- [ ] Clear handling of uncertain recognition
- [ ] Accessible onboarding and conversation navigation
- [ ] No unnecessary dependence on a third person

We should collect feedback from actual users, including Deaf and blind participants wherever possible.

---

## 16. The Final Product Vision

We are not trying to build another messaging application.

We are trying to build a platform where different people can have the same conversation even if they communicate in completely different ways.

A person speaks Hindi. Another signs in ISL. Another types in English. Another uses a screen reader.

Project Sanket makes it possible for all of them to participate in one conversation, using their preferred communication methods.

**Different ways to communicate. One shared conversation.**

---

## 17. Future Vision: App Integration

Beyond the hackathon, we see Sanket becoming an accessibility layer for all phone communication.

### The Problem Today

A person with hearing impairment orders a delivery online. The delivery partner calls to confirm the address or ask for directions. The hearing-impaired person cannot take the call and must rely on another person to handle the conversation.

### The Vision

When Sanket is set up on a user's phone as a hearing-loss profile, incoming calls are intercepted by the application:

1. The delivery partner speaks on the phone.
2. Sanket converts the speech to text and ISL in real time for the hearing-impaired user.
3. The hearing-impaired user replies in sign language.
4. Sanket translates the sign back to speech for the delivery partner.

The delivery partner does not need to install anything. The hearing-impaired person communicates independently.

### Technical Path

- Android Accessibility Service API for system-level integration
- `CallScreeningService` for call interception
- Integration with communication platforms (Zomato, Swiggy, general phone calls)
- Real-time bidirectional speech↔ISL translation pipeline

### When to Build This

This is a Phase 3 vision — after the hackathon, after the core platform is validated, after ISL recognition achieves production-level accuracy. It is a powerful future direction, not a hackathon deliverable.

---

## 18. Team Principles

1. Build something that actually works.
2. Prioritise accessibility and user independence.
3. Never exaggerate AI accuracy.
4. Use Wispr Flow during development.
5. Keep the product voice-first.
6. Work collaboratively and communicate progress.
7. Test with real users wherever possible.
8. Keep the initial scope realistic.
9. Document everything.
10. Be prepared to adapt to the official Round 2 challenge.

---

*Last updated: 22 November 2026*
