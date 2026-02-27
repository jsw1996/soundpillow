import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.soundpillow.app',
  appName: 'SoundPillow',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1e1c23',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
  },
  server: {
    iosScheme: 'capacitor',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1e1c23',
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#1e1c23',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
