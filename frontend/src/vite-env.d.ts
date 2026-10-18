/// <reference types="vite/client" />
/// <reference types="@types/google.accounts" />

interface ImportMetaEnv {
  readonly VITE_PAYMENTS_API_BASE_URL: string
  readonly VITE_GOOGLE_OAUTH_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
