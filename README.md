# SoundPillow 🌙

A sleep & relaxation app featuring ambient sound mixing and AI-generated bedtime stories with neural text-to-speech narration.

## Features

- **Ambient Sound Player** — Browse, play, and favorite calming ambient tracks (rain, ocean, forest, etc.)
- **Sound Mixer** — Layer multiple sounds with independent volume controls to create custom soundscapes
- **AI Sleepcasts** — Daily AI-generated bedtime stories narrated by Azure Neural TTS voices, with ambient background audio
- **Sleep Timer** — Configurable auto-stop timer (15 / 30 / 45 / 60 min)
- **Multi-language** — UI and sleepcasts available in English, Chinese, Japanese, and Spanish
- **iOS App** — Native iOS build via Capacitor

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.8, Vite 6 |
| Styling | Tailwind CSS 4.1, Motion (Framer Motion) |
| Icons | Lucide React |
| Backend | Express 5, TypeScript, ESM |
| AI Stories | OpenRouter API (LLM story generation) |
| TTS | Azure Speech Services (Neural voices) |
| iOS | Capacitor 8 |
| Hosting | Azure Web App (Linux, Node 24 LTS) |

## Project Structure

```
soundpillow/
├── src/                        # React frontend
│   ├── App.tsx                 # Main app with screen routing (AnimatePresence)
│   ├── components/             # Screen components (Home, Player, Mixer, Sleepcast, Profile)
│   ├── context/AppContext.tsx  # Global state management
│   ├── hooks/                  # Audio player, sleep timer, sound mixer, sleepcast hooks
│   ├── services/api.ts        # Server API client
│   ├── i18n/                   # Internationalization (en, zh, ja, es)
│   └── types.ts                # TypeScript interfaces
├── server/                     # Express backend (npm workspace)
│   ├── src/
│   │   ├── index.ts            # Server entry (Express + cron scheduler)
│   │   ├── config.ts           # Environment configuration
│   │   ├── generate.ts         # AI story generation pipeline
│   │   ├── tts.ts              # Azure Speech TTS synthesis module
│   │   ├── store.ts            # JSON file-based story storage
│   │   ├── themes.ts           # Sleepcast theme definitions
│   │   └── routes/             # API route handlers (stories, tts)
│   └── data/                   # Generated stories + audio (gitignored)
├── ios/                        # Capacitor iOS project
├── public/audio/               # Static ambient sound files
└── index.html                  # Vite entry point
```

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **OpenRouter API key** — for AI story generation ([openrouter.ai](https://openrouter.ai))
- **Azure Speech Services key** — for TTS narration ([portal.azure.com](https://portal.azure.com))
- **Xcode** ≥ 16 (only for iOS builds)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

This installs both the frontend and the `server/` workspace.

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set the required keys:

```dotenv
OPENROUTER_API_KEY="your-openrouter-api-key"
AZURE_SPEECH_KEY="your-azure-speech-key"
AZURE_SPEECH_REGION="southeastasia"        # or your region
PORT=3001
CORS_ORIGINS="http://localhost:3000"
LOCALES="en,zh,ja,es"
```

### 3. Generate today's stories

```bash
npm run server:generate
```

This generates stories for all themes × locales with TTS audio. Takes a few minutes on first run.

### 4. Start development servers

In **two terminals**:

```bash
# Terminal 1 — Backend (port 3001)
npm run server:dev

# Terminal 2 — Frontend (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

### Root (frontend + orchestration)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type checking (`tsc --noEmit`) |
| `npm run server:dev` | Start backend in watch mode |
| `npm run server:build` | Compile server TypeScript to `server/dist/` |
| `npm run server:generate` | Manually trigger story + TTS generation |
| `npm run ios:sync` | Build frontend & sync to Xcode project |
| `npm run ios:open` | Open Xcode project |
| `npm run ios:run` | Build, sync, and run on iOS simulator |

### Server workspace (`server/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start server with `tsx watch` (auto-reload) |
| `npm run build` | Compile to `dist/` with `tsc` |
| `npm run start` | Run compiled server (`node dist/index.js`) |
| `npm run generate` | Generate stories for today |

## End-to-End Testing

### Full local flow

1. **Start the server and generate stories:**

   ```bash
   # Start the server
   npm run server:dev

   # In another terminal, generate stories (if not already done)
   npm run server:generate
   ```

2. **Verify the API is working:**

   ```bash
   # Health check
   curl http://localhost:3001/api/health
   # → {"ok":true,"date":"2026-03-01"}

   # Fetch today's English stories
   curl "http://localhost:3001/api/stories/today?locale=en"
   # → {"date":"...","locale":"en","stories":[...]}

   # Check a TTS audio file is served
   curl -I "http://localhost:3001/api/audio/$(date +%Y-%m-%d)/"
   # → 200 OK, Content-Type: audio/mpeg
   ```

3. **Start the frontend and test the UI:**

   ```bash
   npm run dev
   ```

   - **Home screen** — Browse ambient tracks, search, filter by category, toggle favorites
   - **Player screen** — Tap a track to play; test play/pause, seek bar, sleep timer
   - **Mixer screen** — Add multiple tracks, adjust individual volumes, share mix
   - **Sleepcast screen** — Tap a sleepcast theme; verify story loads and narration plays with background audio
   - **Profile screen** — Change language, verify sleepcasts reload in new locale

4. **Test sleepcast narration flow:**

   - Navigate to the Sleepcast screen
   - Tap a theme (e.g., "Rainy Cabin")
   - Verify: story text appears, paragraphs highlight as narration progresses, background ambient audio plays
   - Test pause/resume — narration and background should pause/resume together
   - Test stop — should cleanly stop all audio without errors

5. **Test on-demand TTS fallback:**

   ```bash
   curl -s -X POST "http://localhost:3001/api/tts" \
     -H "Content-Type: application/json" \
     -d '{"text":"Hello, goodnight.","locale":"en"}' \
     --output test.mp3

   # Play the file to verify audio quality
   afplay test.mp3   # macOS
   ```

### iOS simulator

```bash
# Build frontend (pointing to Azure server) and run on simulator
npm run ios:run

# Or step-by-step:
npm run ios:sync       # Build + sync to Xcode
npm run ios:open       # Open in Xcode, then Run (⌘R)
```

### Production verification

```bash
# Health
curl https://sound-pillow-emdgctephrfpbcf3.southeastasia-01.azurewebsites.net/api/health

# Stories
curl "https://sound-pillow-emdgctephrfpbcf3.southeastasia-01.azurewebsites.net/api/stories/today?locale=en"
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/stories/today?locale=en` | Get today's stories for a locale |
| GET | `/api/stories/:date?locale=en` | Get stories for a specific date |
| GET | `/api/stories/dates` | List available dates (last 7 days) |
| POST | `/api/tts` | On-demand TTS (body: `{ text, locale }`) → `audio/mpeg` |
| GET | `/api/audio/:date/:file.mp3` | Serve pre-generated TTS audio files |

## Architecture

### Story Generation Pipeline

```
Cron (8:00 PM UTC, pre-generates the next UTC day) or manual trigger
  → For each theme × locale:
      1. Generate story text via OpenRouter LLM
      2. Synthesize TTS audio for each paragraph (Azure Speech)
      3. Save story JSON + MP3 files to data/
```

Stories are stored as JSON in `server/data/stories/YYYY-MM-DD.json`. Audio files are stored in `server/data/audio/YYYY-MM-DD/`.

### Client Playback

```
User taps sleepcast theme
  → Fetch pre-generated story from /api/stories/today
  → Start background ambient audio (Web Audio API)
  → Play pre-generated TTS audio for each paragraph sequentially
  → Fall back to on-demand /api/tts if pre-generated audio is unavailable
```

## Deployment

### Azure Web App

The server is deployed to Azure Web App with remote build disabled:

```bash
# Build server
cd server && npm run build && cd ..

# Package for deployment
rm -rf /tmp/server-prod && mkdir -p /tmp/server-prod
cp server/package.json /tmp/server-prod/
cp -r server/dist /tmp/server-prod/
cp -r server/data /tmp/server-prod/
cd /tmp/server-prod && npm install --omit=dev
zip -r /tmp/server-deploy.zip .

# Deploy
az webapp deployment source config-zip \
  -n sound-pillow \
  -g appsvc_linux_southeastasia \
  --src /tmp/server-deploy.zip
```

Required app settings on Azure:
- `OPENROUTER_API_KEY`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`
- `CORS_ORIGINS` (include `capacitor://localhost` for iOS)
- `NODE_ENV=production`
- `SCM_DO_BUILD_DURING_DEPLOYMENT=false`

## Environment Variables

### Frontend (build-time)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_SERVER_URL` | `http://localhost:3001` | Backend API URL |
| `GITHUB_PAGES` | — | Set to `true` for GitHub Pages base path |

### Server (runtime)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server listen port |
| `OPENROUTER_API_KEY` | — | **Required.** OpenRouter API key |
| `AZURE_SPEECH_KEY` | — | **Required.** Azure Speech Services key |
| `AZURE_SPEECH_REGION` | `southeastasia` | Azure Speech region |
| `CRON_SCHEDULE` | `0 20 * * *` | Daily pre-generation cron expression for the next UTC day |
| `LOCALES` | `en,zh,ja,es` | Comma-separated locales to generate |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `DATA_DIR` | `data/stories` | Story storage directory |

## License

Private project — all rights reserved.
