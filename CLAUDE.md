# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Vite dev server on :3000
npm run build            # Production build → dist/
npm run lint             # TypeScript type check (tsc --noEmit) — no test suite
npm run server:dev       # Start Express backend on :3001 (watch mode)
npm run server:generate  # Manually generate today's stories + TTS audio
npm run ios:run          # Build frontend, sync Capacitor, run iOS simulator
```

## Architecture

**SoundPillow** — a sleep & relaxation ambient audio player with AI-generated bedtime stories. Mobile-first web app (max-w-md), also deployed to iOS via Capacitor.

**Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4.1 (using `@theme`/`@layer`, not tailwind.config), Motion (framer-motion), Lucide icons, Express 5 backend.

### Routing

No React Router. Screen routing is driven by `AppContext.currentScreen` state (`home | player | mixer | sleepcast | profile`). `App.tsx` renders the active screen inside `AnimatePresence`.

### State Management

Single `AppContext` (React Context) manages all global state: favorites, settings, listening stats, mix presets, journal entries, streak tracking. All persisted to localStorage via `loadFromStorage` utility. No Redux or external state library.

### Audio System

Three separate audio subsystems:
- **`useAudioPlayer`** — Single `HTMLAudioElement` with looping for ambient track playback. Uses track ID ref to detect changes (not URL comparison).
- **`useSoundMixer`** — Web Audio API (`AudioContext` + `GainNode`) for up to 5 simultaneous tracks. Volume changes use `setTargetAtTime` to avoid audio pops.
- **`useSleepcast`** — Fetches pre-generated stories from server, layers 2 ambient background tracks, plays TTS audio sequentially per paragraph. Reuses a single Audio element for narration.

All hooks return `useMemo`-wrapped objects for stable references and wrap their returns in `useMemo` to prevent cascading re-renders.

### Backend (server/)

npm workspace at `server/`. Express 5 app that:
- Generates AI stories on demand via OpenRouter LLM
- Synthesizes TTS audio via Azure Speech Services
- Serves stories and audio files via REST API
- Stores generated content in `server/data/` (gitignored)

### i18n

Custom i18n system in `src/i18n/`. Four locales: `en`, `zh`, `ja`, `es`. Track/category translations use `track_${id}_title` key convention. Locale saved to localStorage.

## Key Conventions

- **iOS is the primary target.** Use `100dvh` not `100vh`. AudioContext requires user gesture to resume. Avoid heavy CSS filters (`blur > 20px`). No `.ogg` audio support on iOS Safari (assets are `.ogg` — known issue requiring conversion).
- **Shared utilities** in `src/utils/`: `audio.ts` (AudioContext lifecycle), `date.ts` (date string formatting), `storage.ts` (localStorage with JSON parsing), `time.ts` (formatTime), `mixShare.ts` (URL-based mix sharing).
- **All custom hooks** return `useMemo`-wrapped objects. `useCallback` deps should reference stable destructured properties (e.g., `player.pause`) not whole hook objects.
- **14 ambient tracks** defined in `src/constants.ts` (IDs "1"–"14"), plus 5 default mix presets and 6 sleepcast themes in `src/data/sleepcastThemes.ts`.
- **Styling** uses Tailwind `@theme` block in `index.css` for CSS custom properties. Dark/light themes switch via `[data-theme]` attribute. Custom classes: `.glass-panel`, `.liquid-glass*`, `.soft-glow`.
- **Animation** uses Motion library. Prefer CSS transitions over infinite Motion animations on iOS for GPU performance.
