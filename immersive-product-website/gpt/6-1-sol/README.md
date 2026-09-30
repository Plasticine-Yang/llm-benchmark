# NOCTURNE ONE

An immersive, responsive headphone launch experience built with React, TypeScript and Vite. All product artwork, icons, optical layers and diagrams are rendered locally with SVG and CSS. Outfit is bundled locally; Chinese text uses the system Chinese font stack.

## Run

```sh
npm install
npm run dev
```

For a production build, run `npm run build`, then `npm run preview`.

## Experience

- Sequenced entrance, levitating headphone installation, moving light and layered glass HUD.
- Pointer-responsive circular soundstage, keyboard direction controls and a quiet, synthesized stereo audio demonstration.
- Sticky, progressively separated product construction, with keyboard-accessible layer controls.
- Three finishes that transition the product material and ambient lighting.
- A 90-second, three-chapter animated design story with pause, replay and seeking.
- Native modal reservation flow with validation, submitting, success and storage-failure states. Escape closes the modal and restores focus.
- Mobile navigation, responsive layouts and a static presentation for reduced-motion preferences.

Reservation and purchase actions record intent in this device's local storage. They do not send emails, contact a server or collect payment. This scope is stated in the form and confirmation.

## Verification

```sh
npx playwright install chromium
npm test
```

The browser tests cover reservation validation and persistence, keyboard focus restoration, finish selection, structure controls, story playback, mobile navigation, audio playback, responsive overflow and reduced-motion behavior at 320, 375, 768 and 1440 pixels. The test server uses port 5188 to avoid conflicts with other local projects.
