import { Track, Category, MixPreset } from './types';

export const CATEGORIES: Category[] = [
  { id: 'favorites', name: 'Favorites', icon: 'Heart' },
  { id: 'nature', name: 'Nature', icon: 'Trees' },
  { id: 'animals', name: 'Animals', icon: 'PawPrint' },
  { id: 'white-noise', name: 'White Noise', icon: 'Wind' },
  { id: 'meditation', name: 'Meditation', icon: 'Sparkles' },
];

export const TRACKS: Track[] = [
  {
    id: '1',
    title: 'Tropical Rain',
    artist: 'Nature Sounds',
    duration: '45 mins',
    category: 'Nature',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/rain_heavy_quiet_interior.ogg`,
    description: 'Gentle rain falling on tropical leaves.'
  },
  {
    id: '2',
    title: 'Midnight Forest',
    artist: 'Deep Sleep',
    duration: '60 mins',
    category: 'Nature',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/forest_night.ogg`,
    description: 'The peaceful sounds of a forest at night.'
  },
  {
    id: '3',
    title: 'Ocean Waves',
    artist: 'Calming Rhythm',
    duration: '30 mins',
    category: 'Nature',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/waves_crashing_on_rock_beach.ogg`,
    description: 'Rhythmic waves crashing on a sandy shore.'
  },
  {
    id: '4',
    title: 'Purring Cat',
    artist: 'Deep Comfort',
    duration: '20 mins',
    category: 'Animals',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/cat_purr.ogg`,
    description: 'The soothing vibration of a happy cat.'
  },
  {
    id: '5',
    title: 'Morning Mist',
    artist: 'Focus & Calm',
    duration: '40 mins',
    category: 'Nature',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/morning_birds.ogg`,
    description: 'Ethereal sounds of a misty morning.'
  },
  {
    id: '6',
    title: 'Silent Snow',
    artist: 'Pure Relaxation',
    duration: '50 mins',
    category: 'Nature',
    imageUrl: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/wind_howling.ogg`,
    description: 'The quiet hush of a snowy landscape.'
  },
  {
    id: '7',
    title: 'Forest Bonfire',
    artist: 'Warm Glow',
    duration: '35 mins',
    category: 'Nature',
    imageUrl: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/daytime_forrest_bonfire.ogg`,
    description: 'The comforting crackle of a campfire in the woods.'
  },
  {
    id: '8',
    title: 'Windy Forest',
    artist: 'Nature Sounds',
    duration: '40 mins',
    category: 'Nature',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/windy_forrest.ogg`,
    description: 'The sound of wind blowing through the trees in a forest.'
  },
  // Meditation tracks — audio sourced from Moodist (MIT license)
  // https://github.com/remvze/moodist
  {
    id: '9',
    title: 'Singing Bowl',
    artist: 'Mindful Meditation',
    duration: '30 mins',
    category: 'Meditation',
    imageUrl: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/singing_bowl.mp3`,
    description: 'Resonant tones of a Tibetan singing bowl for deep meditation.'
  },
  {
    id: '10',
    title: 'Wind Chimes',
    artist: 'Zen Garden',
    duration: '35 mins',
    category: 'Meditation',
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/wind_chimes.mp3`,
    description: 'Delicate wind chimes swaying in a gentle breeze.'
  },
  {
    id: '11',
    title: 'Gentle River',
    artist: 'Meditation Flow',
    duration: '45 mins',
    category: 'Meditation',
    imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/river.mp3`,
    description: 'A calm river flowing through a peaceful valley.'
  },
  {
    id: '12',
    title: 'Rain on Window',
    artist: 'Inner Peace',
    duration: '40 mins',
    category: 'Meditation',
    imageUrl: 'https://images.unsplash.com/photo-1501999635878-71cb5379c2d8?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/rain_on_window.mp3`,
    description: 'Soft rain pattering against a windowpane.'
  },
  {
    id: '13',
    title: 'Theta Waves',
    artist: 'Binaural Beats',
    duration: '30 mins',
    category: 'Meditation',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/binaural_theta.wav`,
    description: 'Theta binaural beats for deep relaxation and meditation.'
  },
  {
    id: '14',
    title: 'Delta Waves',
    artist: 'Deep Sleep Binaural',
    duration: '45 mins',
    category: 'Meditation',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    audioUrl: `${import.meta.env.BASE_URL}audio/binaural_delta.wav`,
    description: 'Delta binaural beats to guide you into deep sleep.'
  }
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
