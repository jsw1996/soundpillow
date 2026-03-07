import { config } from './config.js';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  category: string;
  imageUrl: string;
  imageSourceUrl: string;
  audioUrl: string;
  description: string;
}

interface AudioTrackDefinition {
  id: string;
  title: string;
  artist: string;
  duration: string;
  category: string;
  imageSourceUrl: string;
  blobCoverPath: string;
  blobAudioPath: string;
  description: string;
}

const TRACK_DEFINITIONS: AudioTrackDefinition[] = [
  { id: '1', title: 'Heavy Rain', artist: 'Nature Sounds', duration: '45 mins', category: 'Nature', imageSourceUrl: 'https://images.unsplash.com/photo-1616871154852-e4ba46e8b413?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', blobCoverPath: 'audios/covers/heavy-rain.jpg', blobAudioPath: 'audios/tracks/rain_heavy_quiet_interior.ogg', description: 'Gentle rain falling on tropical leaves.' },
  { id: '2', title: 'Midnight Forest', artist: 'Deep Sleep', duration: '60 mins', category: 'Nature', imageSourceUrl: 'https://images.unsplash.com/photo-1514735555661-d3278da9d5ca?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', blobCoverPath: 'audios/covers/midnight-forest.jpg', blobAudioPath: 'audios/tracks/forest_night.ogg', description: 'The peaceful sounds of a forest.' },
  { id: '3', title: 'Ocean Waves', artist: 'Calming Rhythm', duration: '30 mins', category: 'Nature', imageSourceUrl: 'https://images.unsplash.com/photo-1612387364395-9338e6423547?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', blobCoverPath: 'audios/covers/ocean-waves.jpg', blobAudioPath: 'audios/tracks/waves_crashing_on_rock_beach.ogg', description: 'Rhythmic waves crashing on a sandy shore.' },
  { id: '4', title: 'Purring Cat', artist: 'Deep Comfort', duration: '20 mins', category: 'Animals', imageSourceUrl: 'https://images.unsplash.com/photo-1596921825946-d738194fac80?q=80&w=986&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', blobCoverPath: 'audios/covers/purring-cat.jpg', blobAudioPath: 'audios/tracks/cat_purr.ogg', description: 'The soothing vibration of a happy cat.' },
  { id: '5', title: 'Morning Mist', artist: 'Focus & Calm', duration: '40 mins', category: 'Nature', imageSourceUrl: 'https://images.unsplash.com/photo-1570554797963-c9e212bc8e60?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', blobCoverPath: 'audios/covers/morning-mist.jpg', blobAudioPath: 'audios/tracks/morning_birds.ogg', description: 'Ethereal sounds of a misty morning.' },
  { id: '6', title: 'Wind Howling', artist: 'Pure Relaxation', duration: '50 mins', category: 'Nature', imageSourceUrl: 'https://images.unsplash.com/photo-1694433847591-ad261b35e38e?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', blobCoverPath: 'audios/covers/wind-howling.jpg', blobAudioPath: 'audios/tracks/wind_howling.ogg', description: 'The sound of wind howling through the trees.' },
  { id: '7', title: 'Forest Bonfire', artist: 'Warm Glow', duration: '35 mins', category: 'Nature', imageSourceUrl: 'https://images.unsplash.com/photo-1620224027739-3d0e4cc395a5?q=80&w=1035&auto=format&fit=crop&w=800&q=80', blobCoverPath: 'audios/covers/forest-bonfire.jpg', blobAudioPath: 'audios/tracks/daytime_forrest_bonfire.ogg', description: 'The comforting crackle of a campfire in the woods.' },
  { id: '8', title: 'Rustling Wind', artist: 'Nature Sounds', duration: '40 mins', category: 'Nature', imageSourceUrl: 'https://images.unsplash.com/photo-1656340998995-336456a573ef?q=80&w=1015&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', blobCoverPath: 'audios/covers/rustling-wind.jpg', blobAudioPath: 'audios/tracks/windy_forrest.ogg', description: 'The sound of wind blowing through the trees in a forest.' },
  { id: '9', title: 'Singing Bowl', artist: 'Mindful Meditation', duration: '30 mins', category: 'Meditation', imageSourceUrl: 'https://images.unsplash.com/photo-1619968747226-67769140323a?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', blobCoverPath: 'audios/covers/singing-bowl.jpg', blobAudioPath: 'audios/tracks/singing_bowl.ogg', description: 'Resonant tones of a Tibetan singing bowl for deep meditation.' },
  { id: '10', title: 'Wind Chimes', artist: 'Zen Garden', duration: '35 mins', category: 'Meditation', imageSourceUrl: 'https://images.unsplash.com/photo-1765895193943-35550897cc2d?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', blobCoverPath: 'audios/covers/wind-chimes.jpg', blobAudioPath: 'audios/tracks/wind_chimes.ogg', description: 'Delicate wind chimes swaying in a gentle breeze.' },
  { id: '11', title: 'Gentle River', artist: 'Meditation Flow', duration: '45 mins', category: 'Meditation', imageSourceUrl: 'https://images.unsplash.com/photo-1506318039632-e5626c0c1394?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', blobCoverPath: 'audios/covers/gentle-river.jpg', blobAudioPath: 'audios/tracks/river.ogg', description: 'A calm river flowing through a peaceful valley.' },
  { id: '12', title: 'Rain on Window', artist: 'Inner Peace', duration: '40 mins', category: 'Meditation', imageSourceUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80', blobCoverPath: 'audios/covers/rain-on-window.jpg', blobAudioPath: 'audios/tracks/rain_on_window.ogg', description: 'Soft rain pattering against a windowpane.' },
  { id: '13', title: 'Theta Waves', artist: 'Binaural Beats', duration: '30 mins', category: 'Meditation', imageSourceUrl: 'https://plus.unsplash.com/premium_photo-1679785652664-5893d9829aed?q=80&w=1090&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', blobCoverPath: 'audios/covers/theta-waves.jpg', blobAudioPath: 'audios/tracks/binaural_theta.wav', description: 'Theta binaural beats for deep relaxation and meditation.' },
  { id: '14', title: 'Delta Waves', artist: 'Deep Sleep Binaural', duration: '45 mins', category: 'Meditation', imageSourceUrl: 'https://images.unsplash.com/photo-1621975081039-c814938ea869?q=80&w=1041&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', blobCoverPath: 'audios/covers/delta-waves.jpg', blobAudioPath: 'audios/tracks/binaural_delta.wav', description: 'Delta binaural beats to guide you into deep sleep.' },
];

function resolveAssetUrl(assetPath: string): string {
  return `${config.assetBaseUrl.replace(/\/+$/, '')}/${assetPath}`;
}

export function getAudioCatalog(): AudioTrack[] {
  return TRACK_DEFINITIONS.map((track) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    duration: track.duration,
    category: track.category,
    imageUrl: resolveAssetUrl(track.blobCoverPath),
    imageSourceUrl: track.imageSourceUrl,
    audioUrl: resolveAssetUrl(track.blobAudioPath),
    description: track.description,
  }));
}