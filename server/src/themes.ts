import type { SleepcastTheme } from './types.js';

/** All available sleepcast themes — mirrored from the client */
export const THEMES: SleepcastTheme[] = [
  {
    id: 'cabin-rain',
    name: 'Rainy Cabin',
    icon: 'CloudRain',
    prompt: 'A cozy wooden cabin in the mountains during a gentle rainstorm. The listener is curled up by a warm fireplace, watching raindrops trace paths down the window glass. Describe the textures, the warmth, the sound of the fire crackling, and the smell of pine.',
    imageUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
    bgTrackIds: ['1', '7'],
  },
  {
    id: 'ocean-voyage',
    name: 'Ocean Voyage',
    icon: 'Ship',
    prompt: 'A gentle sailboat journey across a calm moonlit ocean. The listener is lying on deck, watching the stars slowly wheel overhead. Describe the gentle rocking of the boat, the sound of water against the hull, the vast star-filled sky, and the warm sea breeze.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    bgTrackIds: ['3', '6'],
  },
  {
    id: 'enchanted-forest',
    name: 'Enchanted Forest',
    icon: 'Trees',
    prompt: 'A walk through an ancient enchanted forest at twilight. Soft bioluminescent mushrooms glow along the path. Fireflies drift through the air. Describe the moss-covered trees, the gentle stream, the birdsong fading into evening, and the magical sense of peace.',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    bgTrackIds: ['2', '11'],
  },
  {
    id: 'zen-garden',
    name: 'Zen Garden',
    icon: 'Flower2',
    prompt: 'A serene Japanese zen garden at dawn. Stone pathways wind past raked sand patterns and carefully placed rocks. A bamboo water feature clicks rhythmically. Describe the cherry blossoms, the morning mist, the distant sound of a temple bell, and the deep stillness.',
    imageUrl: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?auto=format&fit=crop&w=800&q=80',
    bgTrackIds: ['9', '10'],
  },
  {
    id: 'stargazing',
    name: 'Stargazing',
    icon: 'Star',
    prompt: 'Lying on a warm blanket in a meadow on a clear summer night, far from any city lights. The Milky Way stretches overhead in breathtaking detail. Describe the warm grass, the gentle cricket sounds, shooting stars, and the infinite vastness of space making you feel wonderfully small and peaceful.',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    bgTrackIds: ['5', '14'],
  },
  {
    id: 'snow-lodge',
    name: 'Snow Lodge',
    icon: 'Snowflake',
    prompt: 'A warm ski lodge with floor-to-ceiling windows during a gentle snowfall. You are wrapped in a soft blanket, sipping hot cocoa, watching the snow fall silently. A fire crackles nearby. Describe the warmth contrasting with the cold outside, the thick falling snowflakes, and the deep quiet.',
    imageUrl: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=800&q=80',
    bgTrackIds: ['6', '7'],
  },
];
