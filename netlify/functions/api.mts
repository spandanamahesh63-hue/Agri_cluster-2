// AgriCluster database API for MongoDB (Atlas), as one Netlify Function.
//
// The browser never talks to MongoDB directly: the connection string (with its
// password) lives only here, in the MONGODB_URI environment variable. The app
// calls these routes when VITE_DATABASE=mongodb (see src/services/storage/cloud.ts):
//
//   GET    /api/workspace   load a demo space (x-workspace-id header)
//   POST   /api/workspace   save changes: settings, changed records, deletions
//   DELETE /api/workspace   delete a demo space and its records
//   POST   /api/feedback    add one anonymous feedback response (insert only)
//
// Collections: workspaces (one document per demo space), records (one per
// listing, booking, request, notification…), feedback.
//
// Security matches the Supabase version: a request can only touch the space whose
// id it sends, the id is long and random, and every write is checked for shape
// and size. Prototype-grade: add real sign-in (phone OTP) before real farmer data.
//
// Local development: vite.config.ts serves these routes from `npm run dev`.

import { MongoClient, type Db } from "mongodb";

const COLLECTIONS = new Set([
  "listings", "bookings", "labourRequests", "serviceRequests", "consultations", "interests",
  "requirements", "equipment", "posts", "replies", "notifications", "groups", "events", "supportRequests",
]);
const MAX_BODY = 4_000_000;
const MAX_STATE = 500_000;
const MAX_RECORD = 50_000;
const MAX_UPSERTS = 500;

const validWorkspace = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9-]{20,64}$/.test(id);
const validRecordId = (id: unknown): id is string => typeof id === "string" && id.length > 0 && id.length <= 64;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const size = (x: unknown) => JSON.stringify(x).length;

// One client per warm function instance, reused across requests.
let dbPromise: Promise<Db> | undefined;
function database(): Promise<Db> {
  if (!dbPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new HttpError(503, "MONGODB_URI is not set");
    dbPromise = (async () => {
      const client = await new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 }).connect();
      const db = client.db(process.env.MONGODB_DB || "agricluster");
      await db.collection("records").createIndex({ workspaceId: 1, collection: 1, id: 1 }, { unique: true });
      return db;
    })().catch((e) => {
      dbPromise = undefined;
      throw e;
    });
  }
  return dbPromise;
}

class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const json = (status: number, body: unknown) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function readBody(req: Request): Promise<unknown> {
  const text = await req.text();
  if (text.length > MAX_BODY) throw new HttpError(413, "Request too large");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Body is not JSON");
  }
}

function workspaceFrom(req: Request): string {
  const ws = req.headers.get("x-workspace-id");
  if (!validWorkspace(ws)) throw new HttpError(400, "Missing or invalid x-workspace-id");
  return ws;
}

// ---- Workspaces ----

async function loadWorkspace(ws: string) {
  const db = await database();
  const doc = await db.collection<{ _id: string; state: unknown }>("workspaces").findOne({ _id: ws });
  if (!doc) return json(404, { error: "Not found" });
  const records = await db
    .collection("records")
    .find({ workspaceId: ws }, { projection: { _id: 0, collection: 1, id: 1, position: 1, data: 1 } })
    .sort({ collection: 1, position: -1 })
    .toArray();
  return json(200, { state: doc.state ?? {}, records });
}

interface SaveBody {
  settings?: Record<string, unknown>;
  upserts: { collection: string; id: string; position: number; data: Record<string, unknown> }[];
  deletes: { collection: string; ids: string[] }[];
}

function checkSave(body: unknown): SaveBody {
  if (!isObject(body)) throw new HttpError(400, "Body must be an object");
  const { settings, upserts = [], deletes = [] } = body;
  if (settings !== undefined && (!isObject(settings) || size(settings) > MAX_STATE)) throw new HttpError(400, "Invalid settings");
  if (!Array.isArray(upserts) || upserts.length > MAX_UPSERTS) throw new HttpError(400, "Invalid upserts");
  for (const u of upserts) {
    if (!isObject(u) || !COLLECTIONS.has(u.collection as string) || !validRecordId(u.id) || !Number.isInteger(u.position))
      throw new HttpError(400, "Invalid record");
    if (!isObject(u.data) || u.data.id !== u.id || size(u.data) > MAX_RECORD) throw new HttpError(400, "Invalid record data");
  }
  if (!Array.isArray(deletes)) throw new HttpError(400, "Invalid deletes");
  for (const d of deletes) {
    if (!isObject(d) || !COLLECTIONS.has(d.collection as string) || !Array.isArray(d.ids) || !d.ids.every(validRecordId))
      throw new HttpError(400, "Invalid delete");
  }
  return { settings: settings as SaveBody["settings"], upserts: upserts as SaveBody["upserts"], deletes: deletes as SaveBody["deletes"] };
}

async function saveWorkspace(ws: string, body: SaveBody) {
  const db = await database();
  const now = new Date();
  // The space always exists after a save, even if only records changed.
  await db.collection<{ _id: string }>("workspaces").updateOne(
    { _id: ws },
    { $set: { updatedAt: now, ...(body.settings ? { state: body.settings } : {}) }, $setOnInsert: { createdAt: now, ...(body.settings ? {} : { state: {} }) } },
    { upsert: true },
  );
  const records = db.collection("records");
  for (const d of body.deletes) {
    if (d.ids.length) await records.deleteMany({ workspaceId: ws, collection: d.collection, id: { $in: d.ids } });
  }
  if (body.upserts.length) {
    await records.bulkWrite(
      body.upserts.map((u) => ({
        updateOne: {
          filter: { workspaceId: ws, collection: u.collection, id: u.id },
          update: { $set: { position: u.position, data: u.data, updatedAt: now } },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }
  return json(204, null);
}

async function deleteWorkspace(ws: string) {
  const db = await database();
  await db.collection("records").deleteMany({ workspaceId: ws });
  await db.collection<{ _id: string }>("workspaces").deleteOne({ _id: ws });
  return json(204, null);
}

// ---- Feedback ----

const optText = (x: unknown, max: number) => x === null || x === undefined || (typeof x === "string" && x.length <= max);
const score = (x: unknown) => Number.isInteger(x) && (x as number) >= 1 && (x as number) <= 5;

async function addFeedback(body: unknown) {
  if (!isObject(body)) throw new HttpError(400, "Body must be an object");
  const { role, rating, ease, usefulness, features, experience, suggestions, contact_email, source } = body;
  const ok =
    typeof role === "string" && role.length > 0 && role.length <= 40 &&
    score(rating) &&
    (ease === null || score(ease)) &&
    (usefulness === null || score(usefulness)) &&
    Array.isArray(features) && features.length <= 20 && features.every((f) => typeof f === "string" && f.length <= 80) &&
    optText(experience, 1000) && optText(suggestions, 1000) && optText(contact_email, 120) && optText(source, 40);
  if (!ok) throw new HttpError(400, "Invalid feedback");
  const db = await database();
  await db.collection("feedback").insertOne({
    createdAt: new Date(), role, rating, ease, usefulness, features,
    experience: experience ?? null, suggestions: suggestions ?? null, contact_email: contact_email ?? null, source: source ?? null,
  });
  return json(201, { ok: true });
}

// ---- Router ----

export default async (req: Request): Promise<Response> => {
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  try {
    if (path === "/api/workspace") {
      const ws = workspaceFrom(req);
      if (req.method === "GET") return await loadWorkspace(ws);
      if (req.method === "POST") return await saveWorkspace(ws, checkSave(await readBody(req)));
      if (req.method === "DELETE") return await deleteWorkspace(ws);
    }
    if (path === "/api/feedback" && req.method === "POST") return await addFeedback(await readBody(req));
    if (path === "/api/health" && req.method === "GET") {
      await (await database()).command({ ping: 1 });
      return json(200, { ok: true });
    }
    return json(404, { error: "Not found" });
  } catch (e) {
    if (e instanceof HttpError) return json(e.status, { error: e.message });
    console.error(e);
    return json(500, { error: "Database error" });
  }
};

export const config = { path: "/api/*" };
