import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.carerconnect.app',
  appName: 'carer-connect-monorepo',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Uncomment the following line and replace with your local IP if testing on a physical device
    // hostname: 'YOUR_LOCAL_IP_ADDRESS',
  },
  plugins: {
    // Add any Capacitor plugins here if needed
    // For example:
    // CapacitorHttp: {
    //   enabled: true,
    // },
  },
};

export default config;