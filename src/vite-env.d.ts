/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string;
  readonly VITE_PUBLIC_URL?: string;
  readonly VITE_DOWNLOAD_MAC?: string;
  readonly VITE_DOWNLOAD_WIN?: string;
  readonly VITE_DOWNLOAD_LINUX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
