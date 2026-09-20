import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hydropush.app',
  appName: 'hydropush-app',
  webDir: '../hydropush-react/build',
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: "#1E88E5",
    },
  },
};

export default config;
