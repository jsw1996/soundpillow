# SleepyHub - Project Guide

## Overview
SleepyHub is a sleep & relaxation ambient audio player web app. Users can browse, play, and mix ambient sounds (rain, forest, ocean, etc.) to help them fall asleep.

## Tech Stack
- **Framework**: React 19 + TypeScript 5.8
- **Build**: Vite 6.2 with @vitejs/plugin-react
- **Styling**: Tailwind CSS 4.1 (@tailwindcss/vite)
- **Animations**: Motion 12.x (import from "motion/react")
- **Icons**: Lucide React (import from "lucide-react")
- **API**: Google GenAI (@google/genai) for Gemini integration
- **Runtime**: ES modules, strict TypeScript

## Project Structure
```
src/
├── App.tsx                  # Main app, screen routing via AnimatePresence
├── main.tsx                 # React DOM entry point
├── index.css                # Global styles, Tailwind config, custom animations
├── types.ts                 # TypeScript interfaces (Track, Category, Screen types)
├── constants.ts             # Pre-loaded tracks (8) and categories (5)
├── components/
│   ├── HomeScreen.tsx       # Browse tracks: search, categories, favorites
│   ├── PlayerScreen.tsx     # Full audio player with controls & sleep timer
│   ├── MixerScreen.tsx      # Sound mixer: layer multiple sounds with volume control
│   ├── ProfileScreen.tsx    # User profile & settings page
│   ├── MiniPlayer.tsx       # Mini player bar shown on non-player screens
│   └── Navigation.tsx       # Bottom nav: Home, Mixer, Player, Profile
├── context/
│   └── AppContext.tsx        # Global state: screen, search, favorites, etc.
└── hooks/
    ├── useAudioPlayer.ts    # Single track audio playback, progress, seek
    ├── useSleepTimer.ts     # Sleep timer with presets (15/30/45/60 min)
    └── useSoundMixer.ts     # Multi-track audio mixing with per-track volume
```

## Screens & Navigation
- `home` - Browse and search tracks, category filter, favorites
- `player` - Full-screen audio player with controls, progress, sleep timer
- `mixer` - Sound mixer to layer multiple ambient sounds
- `profile` - User settings, listening stats, preferences

## Design System
- **Theme**: Dark purple (#191022 background, #8c2bee primary accent)
- **Style**: Glass morphism panels (backdrop-blur + semi-transparent borders)
- **Layout**: Mobile-first, max-w-md centered
- **Font**: Manrope (Google Fonts), weights 300-800
- **Animations**: Subtle and calming - breathing glow, floating particles, smooth transitions

## Key Patterns
- Screen routing via `currentScreen` state in AppContext (not React Router)
- AnimatePresence + motion for page transitions
- Custom hooks for audio logic separation (useAudioPlayer, useSoundMixer)
- localStorage for persistence (favorites, settings, listening stats)
- All audio URLs from Google Sounds API

## Development
```bash
npm install          # Install dependencies
npm run dev          # Dev server on port 3000
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run lint         # TypeScript type checking
```

## Environment Variables
- `GEMINI_API_KEY` - Required for Gemini API integration
- `APP_URL` - Injected by AI Studio at runtime

## Current Iteration Status
**In Progress** (2026-02-26):
- [x] Core audio player with playback controls
- [x] Home screen with search, categories, favorites
- [x] Sleep timer with presets
- [ ] UI/UX enhancements: Mini player bar, improved cards, sound wave animations
- [ ] Sound Mixer feature: multi-track layering with independent volume
- [ ] Profile/Settings page: default timer, theme toggle, listening stats
- [ ] Navigation updates for new screens (Mixer, Profile)
