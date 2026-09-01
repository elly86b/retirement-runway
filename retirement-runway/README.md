# Retirement Runway

A React app (Vite + Tailwind + Recharts). This folder is a complete,
ready-to-run project containing the calculator you built in Claude.

## Fastest way to test on phones today (no installs, ~2 minutes)

1. Go to https://stackblitz.com and choose "React" (Vite) as the template.
2. Delete the default `src/App.jsx` it creates, and paste in this project's
   `src/App.jsx` instead.
3. Replace its `src/main.jsx` with this project's `src/main.jsx`.
4. StackBlitz will auto-install `recharts` and `lucide-react` the moment it
   sees them imported (it may take a few seconds).
5. StackBlitz gives you a live preview URL immediately — copy it and send it
   to your friends. It works in any phone browser, no app install needed.
6. On iPhone (Safari) or Android (Chrome), tapping "Add to Home Screen" on
   that URL gives it an app icon and a full-screen, no-browser-bar feel.

Everyone's saved profile stays on their own phone (via their browser's
local storage) — nothing syncs between devices, which is normal for this
kind of personal tool.

## Running it locally (if you have Node.js installed)

```bash
npm install
npm run dev
```

Then open the printed local URL. To test on your phone while developing,
run `npm run dev -- --host` instead and open `http://<your-computer's-ip>:5173`
from your phone (same WiFi network required).

## Deploying it properly (a real URL, works from anywhere)

1. Run `npm run build` — this creates a `dist/` folder with the finished site.
2. Go to https://app.netlify.com/drop and drag the `dist` folder onto the
   page. Netlify gives you a live public URL in seconds — no account
   strictly required for a one-off drop, though creating a free account lets
   you update it later.
3. Alternative: push this folder to a GitHub repo and import it at
   https://vercel.com/new — every push then auto-deploys.

## Later: a real installable app (App Store / Play Store)

This project can be wrapped with Capacitor (https://capacitorjs.com) to
produce a genuine iOS/Android app buildable in Xcode/Android Studio, at
which point you'd need a Mac (for iOS) and Apple ($99/yr) and Google ($25
one-time) developer accounts to publish. Happy to help with that step when
you're ready — it's a bigger project than the steps above.
