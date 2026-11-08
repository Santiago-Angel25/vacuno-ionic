import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.vacuno',
  appName: 'Vacuno',
  webDir: 'www-android',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
