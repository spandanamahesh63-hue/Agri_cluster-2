// Demo activity from other cluster members, seeded into the app store so every
// role has something to act on at the start of a demo. Records are marked
// `seeded` so cluster totals (which already include them) don't double-count.

import type { Booking, CommunityPost, CommunityReply, Consultation, CropListing, LabourRequest } from "../../types";

export const seedBookings: Booking[] = [
  { id: "bk-seed-1", machineryId: "m-tractor-2", requesterUserId: "u-farmer-12", date: "2026-09-28", startHour: 7, hours: 4, purpose: "Land preparation", estimatedCost: 3600, status: "requested", createdAt: "2026-09-26T19:10:00+05:30", seeded: true },
  { id: "bk-seed-2", machineryId: "m-transport-1", requesterUserId: "u-farmer-45", date: "2026-10-04", startHour: 6, hours: 3, purpose: "Harvest transport", estimatedCost: 1800, status: "requested", createdAt: "2026-09-27T07:40:00+05:30", seeded: true },
  { id: "bk-seed-3", machineryId: "m-tractor-3", requesterUserId: "u-farmer-8", date: "2026-09-29", startHour: 9, hours: 3, purpose: "Inter-cultivation", estimatedCost: 2700, status: "accepted", createdAt: "2026-09-25T16:00:00+05:30", seeded: true },
];

export const seedLabourRequests: LabourRequest[] = [
  { id: "lr-seed-1", labourProfileId: "lp-1", requesterUserId: "u-farmer-33", skill: "harvesting", workers: 6, date: "2026-10-04", days: 2, note: "1.5 acres tomato, crates provided.", status: "requested", createdAt: "2026-09-27T06:50:00+05:30", seeded: true },
  { id: "lr-seed-2", labourProfileId: "lp-1", requesterUserId: "u-farmer-58", skill: "grading-packing", workers: 4, date: "2026-10-01", days: 1, note: "Grading at the collection centre.", status: "accepted", createdAt: "2026-09-24T12:00:00+05:30", seeded: true },
];

export const seedConsultations: Consultation[] = [
  {
    id: "cn-seed-1",
    expertId: "ex-1",
    requesterUserId: "u-farmer-3",
    kind: "question",
    topic: "Horticulture specialist",
    message: "Tomato leaves curling upward and new growth is small since last week. Whitefly seen on the underside. Is this leaf curl virus? What should I do?",
    status: "sent",
    createdAt: "2026-09-26T18:20:00+05:30",
    seeded: true,
  },
  {
    id: "cn-seed-2",
    expertId: "ex-1",
    requesterUserId: "u-farmer-42",
    kind: "consultation",
    topic: "Horticulture specialist",
    message: "Would like a field visit to check fruit cracking on 1 acre of tomato before harvest.",
    preferredDate: "2026-09-29",
    status: "scheduled",
    scheduledAt: "2026-09-29T10:00:00+05:30",
    mode: "field-visit",
    createdAt: "2026-09-24T09:00:00+05:30",
    seeded: true,
  },
];

export const seedListings: CropListing[] = [
  { id: "lst-seed-1", farmId: "cf-12", farmLabel: "Farm #12", cropCycleId: "-", crop: "Tomato", grade: "A", quantityTonnes: 2.4, harvestDate: "2026-10-04", availableFrom: "2026-10-04", expectedPricePerKg: 23, location: "Bilikere", photoCount: 2, status: "listed", createdAt: "2026-09-26T10:00:00+05:30", seeded: true },
  { id: "lst-seed-2", farmId: "cf-7", farmLabel: "Farm #7", cropCycleId: "-", crop: "Tomato", grade: "A", quantityTonnes: 1.6, harvestDate: "2026-10-05", availableFrom: "2026-10-05", expectedPricePerKg: 24, location: "Yelwala", photoCount: 1, requirementId: "br-1", status: "offer-sent", createdAt: "2026-09-26T21:15:00+05:30", seeded: true },
  { id: "lst-seed-3", farmId: "cf-63", farmLabel: "Farm #63", cropCycleId: "-", crop: "Onion", grade: "B", quantityTonnes: 6, harvestDate: "2026-10-13", availableFrom: "2026-10-14", expectedPricePerKg: 19, location: "Kadakola", photoCount: 0, status: "listed", createdAt: "2026-09-25T15:30:00+05:30", seeded: true },
  { id: "lst-seed-4", farmId: "cf-41", farmLabel: "Farm #41", cropCycleId: "-", crop: "Chilli", grade: "B", quantityTonnes: 0.9, harvestDate: "2026-11-12", availableFrom: "2026-11-12", expectedPricePerKg: 48, location: "Jayapura", photoCount: 0, status: "listed", createdAt: "2026-09-23T11:00:00+05:30", seeded: true },
];

export const seedPosts: CommunityPost[] = [
  {
    id: "post-seed-1",
    authorUserId: "u-cluster-1",
    authorLabel: "Cluster office",
    authorRole: "cluster",
    category: "announcement",
    title: "Rain expected from this evening — review irrigation",
    body: "The forecast shows an 82% chance of 18–25 mm from about 6:30 pm. If your soil moisture is adequate, consider delaying today's irrigation. Your AgriCluster dashboard shows a suggestion for your own fields.",
    createdAt: "2026-09-27T07:00:00+05:30",
    seeded: true,
  },
  {
    id: "post-seed-2",
    authorUserId: "u-farmer-18",
    authorLabel: "Farm #18",
    authorRole: "farmer",
    category: "question",
    title: "Brown spots with rings on lower tomato leaves after the rain?",
    body: "Started on the lowest leaves two days ago and spreading upwards. Has anyone seen this near Yelwala? What did you spray?",
    createdAt: "2026-09-26T17:30:00+05:30",
    seeded: true,
  },
  {
    id: "post-seed-3",
    authorUserId: "u-farmer-9",
    authorLabel: "Farm #9",
    authorRole: "farmer",
    category: "practice",
    title: "Mulching cut our drip water noticeably",
    body: "We laid paddy-straw mulch on 1 acre of tomato after transplanting. Soil stayed moist longer and we irrigated roughly every third day instead of every second. Happy to show anyone the field.",
    createdAt: "2026-09-24T19:00:00+05:30",
    seeded: true,
  },
  {
    id: "post-seed-4",
    authorUserId: "u-provider-1",
    authorLabel: "Shivakumar Agro Services",
    authorRole: "provider",
    category: "resource",
    title: "Battery sprayer free on Tuesday",
    body: "The 16 L battery sprayer is free all day Tuesday 29 Sept. Request it from Resources → Machinery.",
    createdAt: "2026-09-26T12:00:00+05:30",
    seeded: true,
  },
  {
    id: "post-seed-5",
    authorUserId: "u-farmer-51",
    authorLabel: "Farm #51",
    authorRole: "farmer",
    category: "alert",
    title: "Whitefly seen near Hootagalli",
    body: "Found whitefly on tomato and chilli this morning. Yellow sticky traps are helping; check the underside of leaves.",
    createdAt: "2026-09-27T06:40:00+05:30",
    seeded: true,
  },
];

export const seedReplies: CommunityReply[] = [
  {
    id: "rep-seed-1",
    postId: "post-seed-2",
    authorUserId: "u-expert-1",
    authorLabel: "Dr. Asha Rao",
    authorRole: "expert",
    body: "Rings like a target on lower leaves after wet weather usually point to early blight. Remove the worst leaves, avoid overhead watering, and improve air flow. Please post a photo or ask me directly before spraying so we can confirm.",
    createdAt: "2026-09-26T20:05:00+05:30",
    seeded: true,
  },
  {
    id: "rep-seed-2",
    postId: "post-seed-2",
    authorUserId: "u-farmer-7",
    authorLabel: "Farm #7",
    authorRole: "farmer",
    body: "Same on our field last season. Removing lower leaves early helped a lot.",
    createdAt: "2026-09-26T21:00:00+05:30",
    seeded: true,
  },
];
