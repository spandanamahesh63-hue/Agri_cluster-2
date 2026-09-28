import type {
  AppNotification,
  Booking,
  BuyerRequirement,
  Consultation,
  CropListing,
  LabourRequest,
  MarketInterest,
  ServiceRequest,
  SupportHelp,
  SupportRequest,
} from "../../types";
import { supportById } from "../../data/catalog/support";

export const supportHelpLabels: Record<SupportHelp, string> = {
  eligibility: "Check if I qualify",
  application: "Help filling the application",
  documents: "Help collecting documents",
  compare: "Compare options",
};

const supportStatusNotice: Partial<Record<SupportRequest["status"], string>> = {
  "in-progress": "the cluster office is helping you",
  "documents-needed": "documents needed",
  submitted: "application submitted",
  closed: "request closed",
};
import type { State } from "../../store/AppStore";
import { machinery } from "../../data/mock/resources";
import { labourProfiles, skillLabels } from "../../data/mock/labour";
import { experts } from "../../data/mock/experts";
import { technologies } from "../../data/mock/technology";
import { buyerRequirements } from "../../data/mock/market";
import { farmers } from "../../data/mock/users";
import { farmLabelForUser } from "../../data/mock/farms";
import { formatDate } from "../../utils/format";

export type NewNotification = Omit<AppNotification, "id" | "createdAt" | "read">;

/**
 * Who hears about what (spec §21, Phase 4 connections). Pure functions over the
 * store: given a new record or a status change, return the notifications to send.
 * The store applies them, so every screen that creates or updates a record
 * notifies the other side without extra code.
 */

const farmerOfFarm = (farmId: string) => farmers.find((f) => f.farmIds.includes(farmId))?.userId;
const machineOwner = (s: State, id: string) => [...machinery, ...s.equipment].find((m) => m.id === id);
const requirementById = (s: State, id: string): BuyerRequirement | undefined => [...s.requirements, ...buyerRequirements].find((r) => r.id === id);
const crops = (s: State, farmId: string) => new Set(s.listings.filter((l) => l.farmId === farmId).map((l) => l.crop).concat(farmId === "farm-27" ? ["Tomato"] : []));

export function onAdd(key: string, record: unknown, s: State): NewNotification[] {
  switch (key) {
    case "bookings": {
      const b = record as Booking;
      const m = machineOwner(s, b.machineryId);
      if (!m) return [];
      return [
        {
          userId: m.ownerUserId,
          kind: "machinery",
          title: `${farmLabelForUser(b.requesterUserId)} requested ${m.name} for ${formatDate(b.date)}`,
          body: `${b.hours} h · ${b.purpose}`,
          link: "/provider/bookings",
        },
      ];
    }
    case "labourRequests": {
      const r = record as LabourRequest;
      const crew = labourProfiles.find((p) => p.id === r.labourProfileId);
      if (!crew) return [];
      return [
        {
          userId: crew.userId,
          kind: "labour",
          title: `Labour request received from ${farmLabelForUser(r.requesterUserId)}`,
          body: `${r.workers} workers for ${skillLabels[r.skill].toLowerCase()}${r.crop ? ` (${r.crop.toLowerCase()})` : ""} from ${formatDate(r.date)}${r.location ? ` · ${r.location}` : ""}.`,
          link: "/labour/jobs",
        },
      ];
    }
    case "serviceRequests": {
      const r = record as ServiceRequest;
      const t = technologies.find((x) => x.id === r.technologyId);
      if (!t) return [];
      return [
        {
          userId: t.providerUserId,
          kind: "machinery",
          title: `${farmLabelForUser(r.requesterUserId)} requested ${t.name.toLowerCase()}`,
          body: r.note || undefined,
          link: t.providerUserId.startsWith("u-cluster") ? "/cluster/resources" : "/provider",
        },
      ];
    }
    case "consultations": {
      const c = record as Consultation;
      const ex = experts.find((e) => e.id === c.expertId);
      if (!ex) return [];
      return [
        {
          userId: ex.userId,
          kind: "expert",
          title: c.kind === "question" ? `New question from ${farmLabelForUser(c.requesterUserId)}` : `Consultation request from ${farmLabelForUser(c.requesterUserId)}`,
          body: c.message.length > 90 ? `${c.message.slice(0, 90)}…` : c.message,
          link: "/expert/requests",
        },
      ];
    }
    case "interests": {
      const i = record as MarketInterest;
      const l = s.listings.find((x) => x.id === i.listingId);
      const farmer = l && farmerOfFarm(l.farmId);
      if (!l || !farmer) return [];
      return [
        {
          userId: farmer,
          kind: "buyer",
          title: `Buyer requested your ${l.crop.toLowerCase()} crop`,
          body: `${i.buyerLabel} wants ${i.quantityTonnes} t at ₹${i.pricePerKg}/kg.`,
          link: "/farmer/market",
        },
      ];
    }
    case "listings": {
      const l = record as CropListing;
      if (!l.requirementId) return [];
      const req = requirementById(s, l.requirementId);
      if (!req) return [];
      return [
        {
          userId: req.buyerUserId,
          kind: "buyer",
          title: `${l.farmLabel} offered ${l.quantityTonnes} t of ${l.crop.toLowerCase()}`,
          body: `Against your ${req.quantityTonnes} t Grade ${req.grade} requirement.`,
          link: "/buyer/requests",
        },
      ];
    }
    case "supportRequests": {
      const r = record as SupportRequest;
      const scheme = supportById(r.schemeId);
      if (!scheme) return [];
      return [
        {
          userId: "u-cluster-1",
          kind: "system",
          title: `${farmLabelForUser(r.requesterUserId)} asked for help with ${scheme.name}`,
          body: `${supportHelpLabels[r.help]}${r.note ? ` · “${r.note}”` : ""}`,
          link: "/cluster/support",
        },
      ];
    }
    case "requirements": {
      const r = record as BuyerRequirement;
      return farmers
        .filter((f) => f.farmIds.some((id) => crops(s, id).has(r.crop)))
        .map((f) => ({
          userId: f.userId,
          kind: "market" as const,
          title: `New buyer requirement matches your ${r.crop.toLowerCase()}`,
          body: `${r.buyerLabel} needs ${r.quantityTonnes} t of Grade ${r.grade} for ${formatDate(r.window.start)}–${formatDate(r.window.end)}.`,
          link: "/farmer/market",
        }));
    }
    default:
      return [];
  }
}

const bookingWords: Partial<Record<Booking["status"], string>> = {
  accepted: "was accepted",
  declined: "was declined",
  completed: "is marked completed",
};

export function onUpdate(key: string, before: unknown, patch: Record<string, unknown>, s: State): NewNotification[] {
  if (!before) return [];
  const status = patch.status as string | undefined;
  const changed = status && status !== (before as { status?: string }).status;

  switch (key) {
    case "bookings": {
      const b = before as Booking;
      const words = changed ? bookingWords[status as Booking["status"]] : undefined;
      const m = machineOwner(s, b.machineryId);
      if (!words || !m) return [];
      return [
        {
          userId: b.requesterUserId,
          kind: "machinery",
          title: `Your machinery request ${words}`,
          body: `${m.name} · ${formatDate(b.date)}`,
          link: "/farmer/resources?tab=requests",
        },
      ];
    }
    case "labourRequests": {
      const r = before as LabourRequest;
      const crew = labourProfiles.find((p) => p.id === r.labourProfileId);
      const words = changed
        ? ({ accepted: "accepted your labour request", declined: "declined your labour request", "in-progress": "started work", completed: "marked the work done" } as Record<string, string>)[status!]
        : undefined;
      if (!words || !crew) return [];
      return [
        {
          userId: r.requesterUserId,
          kind: "labour",
          title: `${crew.label} ${words}`,
          body: `${skillLabels[r.skill]} · ${r.workers} workers from ${formatDate(r.date)}`,
          link: "/farmer/resources?tab=requests",
        },
      ];
    }
    case "consultations": {
      const c = before as Consultation;
      const ex = experts.find((e) => e.id === c.expertId);
      if (!changed || !ex) return [];
      const title =
        status === "answered"
          ? `${ex.name} answered your question`
          : status === "scheduled"
            ? "Expert consultation confirmed"
            : status === "completed"
              ? `${ex.name} completed your consultation`
              : undefined;
      if (!title) return [];
      return [
        {
          userId: c.requesterUserId,
          kind: "expert",
          title,
          body: status === "scheduled" && patch.scheduledAt ? `${ex.name} · ${formatDate(patch.scheduledAt as string)}` : ex.name,
          link: "/farmer/experts",
        },
      ];
    }
    case "interests": {
      const i = before as MarketInterest;
      const l = s.listings.find((x) => x.id === i.listingId);
      if (!changed || !l || (status !== "accepted" && status !== "declined")) return [];
      return [
        {
          userId: i.buyerUserId,
          kind: "buyer",
          title: status === "accepted" ? `${l.farmLabel} accepted your request` : `${l.farmLabel} declined your request`,
          body: `${i.quantityTonnes} t ${l.crop.toLowerCase()} at ₹${i.pricePerKg}/kg`,
          link: status === "accepted" ? "/buyer/deals" : "/buyer/requests",
        },
      ];
    }
    case "listings": {
      const l = before as CropListing;
      const farmer = farmerOfFarm(l.farmId);
      if (!farmer) return [];
      // A buyer answering the farmer's offer on a requirement.
      if (l.status === "offer-sent" && status === "agreed")
        return [{ userId: farmer, kind: "buyer", title: "A buyer accepted your offer", body: `${l.quantityTonnes} t ${l.crop.toLowerCase()} · pickup via the cluster`, link: "/farmer/market" }];
      if (l.status === "offer-sent" && patch.offerDeclinedBy)
        return [{ userId: farmer, kind: "buyer", title: `${patch.offerDeclinedBy as string} declined your offer`, body: "Your listing stays visible to other buyers.", link: "/farmer/market" }];
      return [];
    }
    case "supportRequests": {
      const r = before as SupportRequest;
      const scheme = supportById(r.schemeId);
      const words = changed ? supportStatusNotice[status as SupportRequest["status"]] : undefined;
      if (!scheme || !words) return [];
      return [
        {
          userId: r.requesterUserId,
          kind: "system",
          title: `${scheme.name}: ${words}`,
          body: (patch.officeNote as string | undefined) ?? undefined,
          link: "/farmer/support?tab=requests",
        },
      ];
    }
    case "serviceRequests": {
      const r = before as ServiceRequest;
      const t = technologies.find((x) => x.id === r.technologyId);
      if (!changed || !t || status !== "scheduled") return [];
      return [{ userId: r.requesterUserId, kind: "machinery", title: `Your ${t.name.toLowerCase()} request was scheduled`, link: "/farmer/resources?tab=requests" }];
    }
    default:
      return [];
  }
}
