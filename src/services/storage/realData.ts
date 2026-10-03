// Real accounts' data (supabase/shared-data.sql): shared records in `items`, each
// person's private settings in `user_state`, and the member directory. The
// database decides who sees and changes what; this module only reads and writes.

import { supabase } from "../auth/accounts";
import type { Role } from "../../types";

export interface ItemRow {
  collection: string;
  id: string;
  owner: string;
  viewers: string[];
  editors: string[];
  data: { id: string } & Record<string, unknown>;
  updated_at: string;
}

export interface Member {
  id: string;
  name: string;
  role: Role;
  organisation: string | null;
  location: string | null;
  joined: string;
}

export interface RealSnapshot {
  items: ItemRow[];
  /** Private settings and plan; null before the first save. */
  state: Record<string, unknown> | null;
  members: Member[];
}

const fail = (what: string, e: { message: string }) => new Error(`${what}: ${e.message}`);

export async function loadReal(userId: string): Promise<RealSnapshot> {
  const db = supabase();
  const [items, state, members] = await Promise.all([
    db.from("items").select("collection,id,owner,viewers,editors,data,updated_at").order("created_at", { ascending: false }).limit(5000),
    db.from("user_state").select("state").eq("user_id", userId).maybeSingle(),
    db.rpc("members"),
  ]);
  if (items.error) throw fail("Loading records", items.error);
  if (state.error) throw fail("Loading your settings", state.error);
  if (members.error) throw fail("Loading members", members.error);
  return { items: (items.data as ItemRow[]) ?? [], state: (state.data?.state as Record<string, unknown>) ?? null, members: (members.data as Member[]) ?? [] };
}

export async function insertItem(collection: string, data: { id: string }, viewers: string[], editors: string[]): Promise<void> {
  const { error } = await supabase().from("items").insert({ collection, id: data.id, data, viewers, editors });
  if (error) throw fail("Saving", error);
}

/** Change some fields; the database refuses fields this person may not change. */
export async function patchItem(collection: string, id: string, patch: Record<string, unknown>): Promise<void> {
  // JSON can't carry `undefined`: a removed field is stored as null.
  const body = Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v === undefined ? null : v]));
  const { data, error } = await supabase().rpc("patch_item", { p_collection: collection, p_id: id, p_patch: body });
  if (error) throw fail("Saving", error);
  if (!data) throw new Error("Saving: that record can't be changed from this account.");
}

export async function saveUserState(userId: string, state: Record<string, unknown>): Promise<void> {
  const { error } = await supabase().from("user_state").upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
  if (error) throw fail("Saving your settings", error);
}
