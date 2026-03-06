import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import type { DailyStories, GeneratedSleepcast } from './types.js';

function getFilePath(date: string): string {
  return path.join(config.dataDir, `${date}.json`);
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Get a UTC date string offset by N days from now in YYYY-MM-DD format */
export function dateWithOffset(offsetDays: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return formatUtcDate(date);
}

/** Get today's UTC date string in YYYY-MM-DD format */
export function todayDate(): string {
  return dateWithOffset(0);
}

/** Get tomorrow's UTC date string in YYYY-MM-DD format */
export function tomorrowDate(): string {
  return dateWithOffset(1);
}

/** Ensure the data directory exists */
export async function ensureDataDir(): Promise<void> {
  await fs.mkdir(config.dataDir, { recursive: true });
}

/** Load stories for a given date. Returns null if not found. */
export async function loadStories(date: string): Promise<DailyStories | null> {
  try {
    const raw = await fs.readFile(getFilePath(date), 'utf-8');
    return JSON.parse(raw) as DailyStories;
  } catch {
    return null;
  }
}

/** Save the full daily stories object */
export async function saveStories(data: DailyStories): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(getFilePath(data.date), JSON.stringify(data, null, 2), 'utf-8');
}

/** Append a single generated story to a date's file. Creates the file if needed. */
export async function upsertStory(
  date: string,
  themeId: string,
  locale: string,
  sleepcast: GeneratedSleepcast,
): Promise<void> {
  await ensureDataDir();
  let existing = await loadStories(date);
  if (!existing) {
    existing = { date, generatedAt: Date.now(), stories: {} };
  }
  if (!existing.stories[themeId]) {
    existing.stories[themeId] = {};
  }
  existing.stories[themeId][locale] = sleepcast;
  existing.generatedAt = Date.now();
  await saveStories(existing);
}

/** List available dates (most recent first) */
export async function listDates(limit = 7): Promise<string[]> {
  await ensureDataDir();
  const files = await fs.readdir(config.dataDir);
  return files
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''))
    .sort()
    .reverse()
    .slice(0, limit);
}
