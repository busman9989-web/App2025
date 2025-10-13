/// <reference types="vite/client" />

// Global declarations for your app
declare global {
  interface Window {
    Capacitor?: {
      getPlatform: () => string;
      isNativePlatform: () => boolean;
      // Add other Capacitor properties you use
    };
  }
}

// Extend ImportMetaEnv for your custom environment variables
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_NAME?: string;
  // Add other custom env vars you use
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};