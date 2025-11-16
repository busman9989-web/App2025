// Place this file at src/types/global.d.ts

interface Window {
  Capacitor?: any;
}

export {}

declare global {
  interface Window {
    Phaser: any
    __SantaCurrentVolume: number
    chatwootSettings: {
      darkMode: string
    }
    chatwootSDK: {
      run: (config: { websiteToken: string; baseUrl: string }) => void
    }
    $chatwoot: {
      toggle: (state: 'open' | 'close') => void
      setUser?: (userId: string, userInfo: {
        email?: string
        name?: string
        avatar_url?: string
      }) => void
      reset?: () => void
    }
  }
}