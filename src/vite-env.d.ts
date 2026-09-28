/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://abcd.supabase.co. Unset = data stays in the browser. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase public (anon / publishable) key. Never the service_role key. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
