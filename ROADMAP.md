# SoundPillow Product Roadmap

Iteration priorities ordered by impact. Each phase builds on the previous one.

## Phase 1: Retention & Habit Formation (Highest Priority)

Goal: **Day-7 retention** — turn the app from a tool into a nightly habit.

### 1. Smart Bedtime Reminders (Push Notification)

Infer preferred bedtime from historical listening data; send a gentle push 30 min before. Capacitor already supports push. Without reminders, DAU drops sharply after novelty fades.

### 2. Sleep Journey / Unlock System

Unlock new tracks, sleepcast themes, and mood-card styles at streak milestones (7, 14, 30 days). Current streak display is passive; unlocks close the incentive loop.

### 3. Bedtime Routine Flow

Guided sequence: mood check-in → personalized content recommendation → set alarm → auto-play. Reduces decision fatigue at the moment when cognitive resources are lowest.

## Phase 2: Content Depth & Personalization

Goal: **Session length + frequency** — make sure users don't "run out" of content.

### 4. Mood-Based Recommendations

After mood check-in, surface tracks/stories that match (e.g., "tired" → soft white noise, "amazing" → meditation). Mood data is already collected but never fed back into content selection.

### 5. Breathing Exercises

4-7-8, Box Breathing with guided animation + ambient sound overlay. Pure frontend (animation + timer), no new audio assets needed. Core sleep-aid feature present in all competitors.

### 6. Sleepcast Content Expansion

Scale from 6 themes to 20+ full stories. Add "serial" stories that span multiple nights to create next-night anticipation (proven retention lever from Calm's Sleep Stories).

## Phase 3: Social & Growth

Goal: **MAU growth + viral coefficient** — lower acquisition cost through social loops.

### 7. Cloud Sync & Lightweight Accounts

Apple/Google one-tap sign-in → sync mood history, mix presets, streaks across devices. Losing a 90-day streak on device change is a catastrophic experience break. Also prerequisite infrastructure for all social/paid features.

### 8. Community Mood Wall

Anonymous global mood distribution ("68% of users feel Good tonight"). Lightweight social presence that combats bedtime loneliness without requiring a friends system.

### 9. Partner / Family Mode

Invite a partner to view each other's mood status and send sleepcast recommendations. Sleep is a natural two-person scenario; each user organically brings one invite, halving acquisition cost.

## Phase 4: Monetization

Goal: **LTV / ARPPU** — only after retention is stable.

### 10. Freemium Model

- **Free tier:** 5 tracks + basic mixer + mood check-in
- **Premium (¥28/month):** all tracks, unlimited sleepcast, breathing exercises, cloud sync, advanced stats
- Industry benchmark: 3-5% conversion, ~¥200/year ARPPU

## Priority Logic

| Phase | Core Metric | Rationale |
|-------|-------------|-----------|
| 1 | Day-7 retention | Without retention, nothing else matters |
| 2 | Session length + frequency | Content depth determines whether users "outgrow" the app |
| 3 | MAU growth + viral coefficient | Social loops lower acquisition cost |
| 4 | LTV / ARPPU | Monetize only after retention is stable |
