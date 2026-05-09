/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the POS API (no trailing slash), e.g. http://localhost:5000/api/v1 */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
