# EIN app · Level 1 prototype

Expo (React Native) app for ILN's Emotionally Intelligent Negotiation programme. One codebase runs on iPhone, Android and the web.

## Try it

Live prototype: https://oscarrashed3.github.io/ein-app/ (GitHub Pages, served from `docs/`).

To update the live link: `EXPO_OFFLINE=1 CI=1 npx expo export -p web && node scripts/single-file.js && node scripts/pages.js && cp pages/index.html docs/index.html`.

All lesson content is a draft for ILN.

- **On your phone (native):** `npm install`, then `npx expo start`, and scan the QR code with the Expo Go app.
- **In a browser:** `npx expo start --web`, or open the ready-made web build (see `../preview/`).

## What's in it
- `app/welcome.tsx`: first open (name, daily nudge time)
- `app/(tabs)/today.tsx`: streak, the next lesson, this week's practice
- `app/(tabs)/level.tsx`: Level 1 in three modules; lessons open one after another
- `app/(tabs)/you.tsx`: stats, settings, prototype-only demo controls
- `app/lesson/[id].tsx`: lesson player (feedback sheet, XP, combo, results, streak moment)
- `src/lesson/`: exercises: Roleplay (their-side meter), Swipe, Order, Read the room, Choice
- `src/content/level1.ts`: **all lesson content (draft for ILN approval)**
- `src/state/progress.tsx`: progress and streaks (on the device for now; Supabase later)
- `src/components/VideoCard.tsx`: placeholder video (Mux later)

## Not in the prototype (on purpose)
Accounts, sync, real videos, push notifications, manager dashboard, enterprise features.
