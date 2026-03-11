# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Vite dev server on :3000
npm run build            # Production build -> dist/
npm run lint             # TypeScript type check (tsc --noEmit); no test suite
npm run server:dev       # Start Express backend on :3001 (tsx watch)
npm run server:build     # Compile server TypeScript -> server/dist/
npm run assets:upload    # Upload ambient track audio + cover images to Azure Blob
npm run ios:run          # Build frontend, sync Capacitor, run iOS target
```

## Architecture

**SoundPillow** - a sleep and relaxation app with ambient audio playback, a sound mixer, curated sleepcast previews, and a daily mood check-in flow. Mobile-first web app (`max-w-md` shell), also shipped to iOS via Capacitor.

**Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4.1 (using `@theme` / `@layer` in `src/index.css`), Motion (`motion/react`), Lucide icons, Express 5 backend, Capacitor 8.

### Routing

No React Router. Screen routing is driven by `AppContext.currentScreen` state (`home | player | mixer | sleepcast | profile`). `App.tsx` renders the active screen inside `AnimatePresence`. App launch also shows the `MoodCheckIn` startup overlay before normal navigation.

### State Management

- `AppContext` manages screen state, search/favorites UI, fetched track catalog + loading/error state, fetched curated story catalog, settings, listening stats, mix presets, journal entries, and streak tracking.
- `LanguageProvider` owns locale state (`en | zh | ja | es`) and persists it separately to localStorage.
- Mood check-in UI state lives in `useMoodCard` / `useMoodCheckIn`, not in `AppContext`.
- Persisted state is split between `loadFromStorage(...)` helpers and direct localStorage writes. Fetched track/story catalogs are not persisted.

### Audio System

Three separate audio subsystems:

- **`useAudioPlayer`** - Single looping `HTMLAudioElement` for ambient track playback. Uses a loaded track ID ref to detect track changes instead of comparing URLs.
- **`useSoundMixer`** - Web Audio API (`AudioContext` + `GainNode`) for up to 5 simultaneous ambient tracks. Volume changes use `setTargetAtTime(...)`.
- **`useSleepcast`** - Plays curated sleepcast preview audio sequentially through a reusable `Audio` element while layering 2 ambient background tracks underneath.

### Backend (`server/`)

`server/` is an npm workspace with an Express 5 app that:

- serves ambient track metadata at `/api/audios`
- serves curated story catalog data at `/api/stories`
- exposes a runtime mood-message endpoint at `/api/mood/message`
- does **not** expose runtime story-generation or runtime TTS endpoints

Ambient track metadata and curated story assets resolve to Azure Blob URLs via `ASSET_BASE_URL`.

### i18n

Custom i18n system in `src/i18n/`. Four locales: `en`, `zh`, `ja`, `es`. Locale is saved to localStorage.

Common translation key patterns:

- `track_${id}_title`, `track_${id}_artist`, `track_${id}_desc`
- `mix_default_${n}`
- category keys such as `catNature`, `catMeditation`

## Key Conventions

- **iOS is the primary target.** Prefer `100dvh` / `h-dvh`, preserve safe-area handling, and assume `AudioContext` may need a user gesture to resume.
- **Opening the app counts as a daily check-in.** `App.tsx` calls `checkIn()` on mount before normal playback interactions.
- **Theme is document-level state.** The current theme is mirrored through `[data-theme]`, and `App.tsx` also updates the document `theme-color` meta tag for the app shell.
- **Tracks are server-driven.** There are currently 14 ambient tracks defined in `server/src/audioCatalog.ts`, 5 default mixes in `src/constants.ts`, and 6 sleepcast themes in `src/data/sleepcastThemes.ts`.
- **Sleepcast UI is catalog-driven.** `catalogStories` powers curated preview playback in the sleepcast screen.
- **Shared utilities** in `src/utils/` include `audio.ts`, `date.ts`, `storage.ts`, `time.ts`, `mixShare.ts`, `mood.ts`, and `moodShareImage.ts`.
- **Do not assume every hook returns a memoized object.** Major hooks like `useAudioPlayer`, `useSoundMixer`, `useSleepTimer`, and `useSleepcast` do, but others such as `useMoodCard` do not. Check the hook implementation before relying on object identity in dependency arrays.
- **Styling** uses Tailwind `@theme` in `src/index.css` plus custom classes such as `.glass-panel`, `.liquid-glass*`, `.soft-glow`, and sleepcast-specific shell/card classes.
- **Animation** uses Motion plus CSS keyframes. Preserve the existing visual language instead of introducing new routing/state frameworks or divergent interaction patterns.

## Product Roadmap

See [ROADMAP.md](ROADMAP.md) for the phased iteration plan (retention → content → social → monetization). When implementing new features, check the roadmap for context on priorities and design rationale.
