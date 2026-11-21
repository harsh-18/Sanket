# Sanket — Communication Prototype

**Tagline:** Different ways to communicate. One shared conversation.

This repository contains the Sanket front-end prototype organized into separate HTML, JavaScript, and supporting folders.

## Project structure

```text
sanket/
├── README.md
├── src/
│   ├── index.html   # App markup and styling
│   └── app.js      # Front-end interaction logic
├── assets/          # Images, icons, fonts (add assets here)
│   └── README.md
└── docs/           # Project notes and setup guidance
    └── README.md
```

## Run locally

No build step is needed for this prototype.
1. Open `src/index.html` in a modern browser, or run a simple local server from this folder.
2. For microphone/camera features, use localhost or HTTPS and grant browser permissions. Chrome or Edge is recommended.

## GitHub Pages deployment
1. Upload the entire `sanket` folder to your GitHub repository.
2. Commit and push to the `main` branch.
3. Open **Settings → Pages** and set the source to **GitHub Actions**.
4. The included `.github/workflows/pages.yml` publishes `sanket/src/index.html` and `sanket/src/app.js` automatically.
5. After the workflow finishes, GitHub will display the published site URL in the Pages settings and workflow deployment summary.

## Prototype scope

This is a browser-side prototype. Room/session behavior and browser features should be reviewed and tested on multiple devices before presenting it as a production multi-user service. It does not include a deployed backend, authentication, or persistent server-side messaging.
