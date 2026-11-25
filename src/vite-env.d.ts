/// <reference types="vite/client" />

declare module 'virtual:grammar-rule-ids' {
  const ids: Readonly<Record<string, readonly string[]>>;
  export default ids;
}

declare module 'virtual:pwa-register/react' {
  export function useRegisterSW(options?: {
    immediate?: boolean;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }): {
    needRefresh: [boolean, (value: boolean) => void];
    offlineReady: [boolean, (value: boolean) => void];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}
