// Who can see and change each new record, for real accounts. The database
// (supabase/shared-data.sql) enforces what editors may change; this only says
// who the record is shared with.
//   'all'          every approved member
//   'role:<role>'  everyone approved in that role
//   'user:<id>'    one person

import type { CollectionKey, State } from "../../store/AppStore";

/** The cluster office as a notification recipient: rules address it as this id. */
export const CLUSTER_OFFICE = "u-cluster-1";

const user = (id: string | undefined) => (id ? [`user:${id}`] : []);

/** Notification recipients: a person, or the whole cluster office. */
export const recipientPrincipal = (userId: string) => (userId === CLUSTER_OFFICE || userId === "role:cluster" ? "role:cluster" : userId.startsWith("role:") ? userId : `user:${userId}`);

export function accessFor(key: CollectionKey | "crews" | "experts" | "technologies", record: Record<string, unknown>, s: State, ownerOf: (collection: string, id: string) => string | undefined): { viewers: string[]; editors: string[] } {
  const r = record as Record<string, string | undefined>;
  switch (key) {
    case "supportRequests":
      return { viewers: ["role:cluster"], editors: ["role:cluster"] };
    case "listings": {
      // Offered against a requirement: only that buyer may answer; open listings: any buyer may show interest.
      const req = r.requirementId ? s.requirements.find((x) => x.id === r.requirementId) : undefined;
      return { viewers: ["role:buyer", "role:cluster"], editors: req ? user(req.buyerUserId) : ["role:buyer"] };
    }
    case "interests": {
      const farmer = ownerOf("listings", r.listingId ?? "");
      return { viewers: [...user(farmer), "role:cluster"], editors: user(farmer) };
    }
    case "bookings": {
      const owner = s.equipment.find((m) => m.id === r.machineryId)?.ownerUserId;
      return { viewers: [...user(owner), "role:cluster"], editors: user(owner) };
    }
    case "labourRequests": {
      const crew = ownerOf("crews", r.labourProfileId ?? "");
      return { viewers: [...user(crew), "role:cluster"], editors: user(crew) };
    }
    case "serviceRequests": {
      const provider = ownerOf("technologies", r.technologyId ?? "");
      return { viewers: [...user(provider), "role:cluster"], editors: user(provider) };
    }
    case "consultations": {
      const expert = ownerOf("experts", r.expertId ?? "");
      return { viewers: user(expert), editors: user(expert) };
    }
    case "notifications": {
      const to = recipientPrincipal(r.userId ?? "");
      return { viewers: [to], editors: [to] };
    }
    default:
      // Requirements, equipment, technology, crews, experts, posts, replies, groups, events.
      return { viewers: ["all"], editors: [] };
  }
}
