import { Category, MixPreset } from './types';

export const CATEGORIES: Category[] = [
  { id: 'favorites', name: 'Favorites', icon: 'Heart' },
  { id: 'nature', name: 'Nature', icon: 'Trees' },
  { id: 'animals', name: 'Animals', icon: 'PawPrint' },
  { id: 'white-noise', name: 'White Noise', icon: 'Wind' },
  { id: 'meditation', name: 'Meditation', icon: 'Sparkles' },
];

export const DEFAULT_MIXES: MixPreset[] = [
  {
    id: 'default-1',
    name: 'Summer Bonfire Night',
    tracks: [
      { trackId: '2', volume: 52, isActive: true },
      { trackId: '7', volume: 50, isActive: true },
    ],
    createdAt: 0,
  },
  {
    id: 'default-2',
    name: 'Rainy Forest',
    tracks: [
      { trackId: '1', volume: 60, isActive: true },
      { trackId: '2', volume: 40, isActive: true },
      { trackId: '8', volume: 30, isActive: true },
    ],
    createdAt: 0,
  },
  {
    id: 'default-3',
    name: 'Ocean Breeze',
    tracks: [
      { trackId: '3', volume: 65, isActive: true },
      { trackId: '6', volume: 35, isActive: true },
    ],
    createdAt: 0,
  },
  {
    id: 'default-4',
    name: 'Cozy Campfire',
    tracks: [
      { trackId: '7', volume: 55, isActive: true },
      { trackId: '4', volume: 40, isActive: true },
      { trackId: '8', volume: 25, isActive: true },
    ],
    createdAt: 0,
  },
  {
    id: 'default-5',
    name: 'Zen Meditation',
    tracks: [
      { trackId: '9', volume: 50, isActive: true },
      { trackId: '13', volume: 35, isActive: true },
      { trackId: '12', volume: 40, isActive: true },
    ],
    createdAt: 0,
  },
];
