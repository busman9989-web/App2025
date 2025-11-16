declare global {
  interface Window {
    $chatwoot?: {
      toggle: (state: 'open' | 'close') => void;
      setUser?: (userId: string, userInfo: {
        email?: string;
        name?: string;
        avatar_url?: string;
      }) => void;
      reset?: () => void;
    };
    chatwootSDK?: {
      run: (config: {
        websiteToken: string;
        baseUrl: string;
      }) => void;
    };
  }
}

export {};