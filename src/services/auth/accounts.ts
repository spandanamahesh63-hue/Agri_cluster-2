// Real accounts: phone sign-in with an SMS code (Supabase Auth) and a profile per
// person (supabase/accounts.sql). Turned on with VITE_ACCOUNTS=real; until then
// the site only offers the demo.
//
// The rules that matter (farmers approved on joining, other roles wait for an
// admin, nobody approves themselves) live in the database, not here.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "../../types";

const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Real sign-in is switched on and Supabase is configured. */
export const accountsEnabled = import.meta.env.VITE_ACCOUNTS === "real" && !!URL_ && !!KEY && /^https?:\/\//.test(URL_);

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!accountsEnabled) throw new Error("Real accounts are not switched on.");
  client ??= createClient(URL_!, KEY!, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "agricluster:auth" } });
  return client;
}

export type ProfileStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  status: ProfileStatus;
  is_admin: boolean;
  phone: string | null;
  organisation: string | null;
  location: string | null;
  about: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/** "98450 12345", "+91 98450 12345" or "098450 12345" → "+919845012345"; null if not an Indian mobile. */
export function toE164(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, "").replace(/^\+?91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

/** "919845012345" (as Supabase stores it) → "+91 98450 12345". */
export function formatPhone(p: string | null | undefined): string {
  if (!p) return "";
  const d = p.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : p;
}

/** Plain-language versions of the errors people actually hit. */
export function friendlyAuthError(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e);
  if (/expired|invalid.*(otp|token)|token.*(invalid|expired)/i.test(m)) return "That code is wrong or has expired. Check the SMS, or send a new code.";
  if (/rate limit|too many|security purposes/i.test(m)) return "Too many tries. Wait a minute, then send a new code.";
  if (/phone.*(provider|disabled|not enabled)|unsupported phone provider|sms/i.test(m)) return "We couldn't send an SMS right now. Please try again later, or contact us.";
  if (/fetch|network/i.test(m)) return "No connection. Check your internet and try again.";
  return m;
}

export async function sendCode(phoneE164: string): Promise<void> {
  const { error } = await supabase().auth.signInWithOtp({ phone: phoneE164 });
  if (error) throw error;
}

export async function verifyCode(phoneE164: string, code: string): Promise<string> {
  const { data, error } = await supabase().auth.verifyOtp({ phone: phoneE164, token: code, type: "sms" });
  if (error) throw error;
  if (!data.user) throw new Error("Sign-in didn't complete. Please try again.");
  return data.user.id;
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase().auth.getSession();
  return data.session?.user.id ?? null;
}

export async function signOutAccount(): Promise<void> {
  await supabase().auth.signOut();
}

const COLUMNS = "id,name,role,status,is_admin,phone,organisation,location,about,reviewed_at,created_at";

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase().from("profiles").select(COLUMNS).eq("id", userId).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export interface NewProfile {
  name: string;
  role: Role;
  organisation?: string;
  location?: string;
  about?: string;
}

export async function createProfile(userId: string, p: NewProfile): Promise<Profile> {
  const { data, error } = await supabase()
    .from("profiles")
    .insert({ id: userId, name: p.name.trim(), role: p.role, organisation: p.organisation?.trim() || null, location: p.location?.trim() || null, about: p.about?.trim() || null })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data as Profile;
}

/** Admin: everyone, newest first. The database only returns this list to admins. */
export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase().from("profiles").select(COLUMNS).order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Profile[]) ?? [];
}

/** Admin: approve or reject someone, optionally changing their role. */
export async function reviewProfile(id: string, patch: { status: ProfileStatus; role?: Role }): Promise<Profile> {
  const { data, error } = await supabase().from("profiles").update(patch).eq("id", id).select(COLUMNS).single();
  if (error) throw error;
  return data as Profile;
}
