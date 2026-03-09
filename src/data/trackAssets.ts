export interface TrackAsset {
  localAudioPath: string;
  blobAudioPath: string;
  sourceImageUrl: string;
  blobCoverPath: string;
}

export const TRACK_ASSETS: Record<string, TrackAsset> = {
  '1': {
    localAudioPath: 'audio_normalized/heavy_rain2.mp3',
    blobAudioPath: 'audios/tracks/heavy_rain2.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1616871154852-e4ba46e8b413?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    blobCoverPath: 'audios/covers/heavy-rain.jpg',
  },
  '2': {
    localAudioPath: 'audio_normalized/forest_night2.mp3',
    blobAudioPath: 'audios/tracks/forest_night2.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1514735555661-d3278da9d5ca?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    blobCoverPath: 'audios/covers/midnight-forest.jpg',
  },
  '3': {
    localAudioPath: 'audio_normalized/sea_wave2.mp3',
    blobAudioPath: 'audios/tracks/sea_wave2.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1612387364395-9338e6423547?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    blobCoverPath: 'audios/covers/ocean-waves.jpg',
  },
  '4': {
    localAudioPath: 'audio_normalized/cat_purr2.mp3',
    blobAudioPath: 'audios/tracks/cat_purr2.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1596921825946-d738194fac80?q=80&w=986&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    blobCoverPath: 'audios/covers/purring-cat.jpg',
  },
  '5': {
    localAudioPath: 'audio_normalized/morning_birds.mp3',
    blobAudioPath: 'audios/tracks/morning_birds.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1570554797963-c9e212bc8e60?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    blobCoverPath: 'audios/covers/morning-mist.jpg',
  },
  '6': {
    localAudioPath: 'audio_normalized/wind_howling.mp3',
    blobAudioPath: 'audios/tracks/wind_howling.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1694433847591-ad261b35e38e?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    blobCoverPath: 'audios/covers/wind-howling.jpg',
  },
  '7': {
    localAudioPath: 'audio_normalized/bonfire2.mp3',
    blobAudioPath: 'audios/tracks/bonfire2.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1620224027739-3d0e4cc395a5?q=80&w=1035&auto=format&fit=crop&w=800&q=80',
    blobCoverPath: 'audios/covers/forest-bonfire.jpg',
  },
  '8': {
    localAudioPath: 'audio_normalized/rustling_wind2.mp3',
    blobAudioPath: 'audios/tracks/rustling_wind2.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1656340998995-336456a573ef?q=80&w=1015&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    blobCoverPath: 'audios/covers/rustling-wind.jpg',
  },
  '9': {
    localAudioPath: 'audio_normalized/singing_bowl.mp3',
    blobAudioPath: 'audios/tracks/singing_bowl.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1619968747226-67769140323a?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    blobCoverPath: 'audios/covers/singing-bowl.jpg',
  },
  '10': {
    localAudioPath: 'audio_normalized/wind_chimes.mp3',
    blobAudioPath: 'audios/tracks/wind_chimes.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1765895193943-35550897cc2d?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    blobCoverPath: 'audios/covers/wind-chimes.jpg',
  },
  '11': {
    localAudioPath: 'audio_normalized/river.mp3',
    blobAudioPath: 'audios/tracks/river.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1506318039632-e5626c0c1394?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    blobCoverPath: 'audios/covers/gentle-river.jpg',
  },
  '12': {
    localAudioPath: 'audio_normalized/calming_rain2.mp3',
    blobAudioPath: 'audios/tracks/calming_rain2.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
    blobCoverPath: 'audios/covers/rain-on-window.jpg',
  },
  '13': {
    localAudioPath: 'audio_normalized/binaural_theta.mp3',
    blobAudioPath: 'audios/tracks/binaural_theta.mp3',
    sourceImageUrl: 'https://plus.unsplash.com/premium_photo-1679785652664-5893d9829aed?q=80&w=1090&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    blobCoverPath: 'audios/covers/theta-waves.jpg',
  },
  '14': {
    localAudioPath: 'audio_normalized/binaural_delta.mp3',
    blobAudioPath: 'audios/tracks/binaural_delta.mp3',
    sourceImageUrl: 'https://images.unsplash.com/photo-1621975081039-c814938ea869?q=80&w=1041&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    blobCoverPath: 'audios/covers/delta-waves.jpg',
  },
};