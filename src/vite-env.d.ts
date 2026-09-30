/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "mongodb", "supabase" or "off". Unset = Supabase when its URL and key are set, else the browser only. */
  readonly VITE_DATABASE?: string;
  /** Where the MongoDB API is served (netlify/functions/api.mts). Default "/api" on the same site. */
  readonly VITE_API_URL?: string;
  /** Supabase project URL, e.g. https://abcd.supabase.co. Unset = data stays in the browser. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase public (anon / publishable) key. Never the service_role key. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
