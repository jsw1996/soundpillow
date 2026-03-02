import { MixerTrack, MixPreset } from '../types';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

/**
 * Encodes a mix preset into a compact URL-safe string.
 * Format: name|trackId:volume,trackId:volume,...
 * Encoded as base64url.
 */
export function encodeMix(name: string, tracks: MixerTrack[]): string {
  const activeTracks = tracks.filter((t) => t.isActive);
  if (activeTracks.length === 0) return '';

  const trackStr = activeTracks
    .map((t) => `${t.trackId}:${Math.round(t.volume)}`)
    .join(',');
  const payload = `${name}|${trackStr}`;

  // Base64url encode (URL-safe variant)
  return btoa(payload)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes a base64url mix string back into a name and track list.
 * Returns null if the string is invalid.
 */
export function decodeMix(encoded: string): { name: string; tracks: MixerTrack[] } | null {
  try {
    // Restore base64 padding
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';

    const payload = atob(base64);
    const [name, trackStr] = payload.split('|');
    if (!name || !trackStr) return null;

    const tracks: MixerTrack[] = trackStr.split(',').map((part) => {
      const [trackId, volumeStr] = part.split(':');
      const volume = parseInt(volumeStr, 10);
      if (!trackId || isNaN(volume)) throw new Error('Invalid track');
      return { trackId, volume: Math.max(0, Math.min(100, volume)), isActive: true };
    });

    if (tracks.length === 0) return null;
    return { name, tracks };
  } catch {
    return null;
  }
}

/**
 * Gets the shareable base URL for the app.
 * Uses VITE_APP_URL env var to avoid Capacitor's `capacitor://localhost` scheme.
 * Falls back to window.location if running in a regular browser.
 */
function getBaseUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/+$/, '');

  // In a normal browser, window.location.origin works fine
  const origin = window.location.origin;
  if (origin && !origin.startsWith('capacitor://') && !origin.startsWith('file://')) {
    return origin + window.location.pathname.replace(/\/+$/, '');
  }

  // Fallback — just return the mix param so the user can append it manually
  return '';
}

/**
 * Builds a full shareable URL for a mix.
 */
export function buildShareUrl(name: string, tracks: MixerTrack[]): string {
  const encoded = encodeMix(name, tracks);
  if (!encoded) return '';

  const base = getBaseUrl();
  if (!base) return `?mix=${encoded}`;
  return `${base}?mix=${encoded}`;
}

/**
 * Extracts the mix parameter from the current URL, if present.
 * Returns the decoded mix or null.
 */
export function getMixFromUrl(): { name: string; tracks: MixerTrack[] } | null {
  const params = new URLSearchParams(window.location.search);
  const mixParam = params.get('mix');
  if (!mixParam) return null;
  return decodeMix(mixParam);
}

/**
 * Clears the mix parameter from the URL without reloading the page.
 */
export function clearMixFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('mix');
  window.history.replaceState({}, '', url.toString());
}

/**
 * Shares a mix using Capacitor Share (native iOS/Android), Web Share API, or clipboard fallback.
 * Returns 'shared' | 'copied' | 'failed'.
 */
export async function shareMix(
  name: string,
  tracks: MixerTrack[],
  shareText?: string,
): Promise<'shared' | 'copied' | 'failed'> {
  const url = buildShareUrl(name, tracks);
  if (!url) return 'failed';

  const text = shareText || `Listen to "${name}" on SoundPillow`;

  // 1. Capacitor native share (iOS/Android) — opens the native share sheet
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({ title: name, text, url, dialogTitle: name });
      return 'shared';
    } catch {
      // User cancelled or share failed — don't fall through
      return 'failed';
    }
  }

  // 2. Web Share API (mobile browsers)
  if (navigator.share) {
    try {
      await navigator.share({ title: name, text, url });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'failed';
    }
  }

  // 3. Fallback: copy to clipboard (desktop browsers)
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/**
 * Share a mix and show the appropriate toast notification.
 */
export async function shareAndNotify(
  name: string,
  tracks: MixerTrack[],
  shareText: string,
  toastCopied: string,
  toastShared: string,
  showToastFn: (msg: string) => void,
): Promise<void> {
  const result = await shareMix(name, tracks, shareText);
  if (result === 'copied') showToastFn(toastCopied);
  else if (result === 'shared') showToastFn(toastShared);
}

/**
 * Converts a decoded shared mix into a MixPreset object.
 */
export function sharedMixToPreset(decoded: { name: string; tracks: MixerTrack[] }): MixPreset {
  return {
    id: `shared-${Date.now()}`,
    name: decoded.name,
    tracks: decoded.tracks,
    createdAt: Date.now(),
  };
}
