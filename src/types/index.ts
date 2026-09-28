// AgriCluster domain model.
// Every value the UI shows should trace back to one of these entities, and every
// entity carries (directly or via its parent) a DataSource so the UI can label
// demo / simulated / indicative values honestly.

export type ISODate = string; // "2026-09-27"
export type ISODateTime = string; // "2026-09-27T08:30:00+05:30"

/** Where a value came from. Only "live" may be presented as real operational data. */
export type DataSource = "demo" | "simulated" | "indicative" | "prototype" | "live";

// ---------------------------------------------------------------------------
// Users & roles
// ---------------------------------------------------------------------------

export type Role = "farmer" | "cluster" | "buyer" | "provider" | "labour" | "expert" | "community";

export interface User {
  id: string;
  role: Role;
  name: string;
  /** Short label shown in the UI, e.g. "Farm #27" — avoids exposing names by default. */
  displayLabel: string;
  clusterId: string;
  location: string;
}

export type FarmerObjective = "income" | "cost" | "sustainability";

export type FarmingMethod = "conventional" | "organic" | "natural" | "precision" | "mixed";

export interface Farmer {
  userId: string;
  farmIds: string[];
  objective: FarmerObjective;
  method: FarmingMethod;
}

/** What the farmer tells us during onboarding / on the My Farm screen. */
export interface FarmerProfile {
  objective: FarmerObjective;
  method: FarmingMethod;
  onboarded: boolean;
  /** Privacy: show the farmer's name (not just "Farm #27") to buyers. */
  showNameToBuyers: boolean;
  declared?: {
    village: string;
    acres: number;
    irrigation: IrrigationType;
    crop: string;
    cropAcres: number;
    sowingDate: ISODate;
    stage: CropStage;
  };
}

// ---------------------------------------------------------------------------
// Cluster, farms, crops
// ---------------------------------------------------------------------------

export interface Cluster {
  id: string;
  name: string;
  region: string;
  farmerCount: number;
  cultivatedAcres: number;
  mainCrops: string[];
  source: DataSource;
}

export type IrrigationType = "drip" | "sprinkler" | "flood" | "rainfed";

export interface PumpProfile {
  powerKw: number;
  flowLitresPerHour: number;
  energy: "grid" | "solar" | "solar+grid";
  /** Hours of the day (local) when grid supply is typically available. */
  gridHours?: [number, number];
}

export interface Farm {
  id: string;
  label: string; // "Farm #27"
  ownerUserId: string;
  clusterId: string;
  village: string;
  totalAcres: number;
  irrigation: IrrigationType;
  pump: PumpProfile;
  fieldIds: string[];
}

export type CropStage =
  | "nursery"
  | "vegetative"
  | "flowering"
  | "fruit-development"
  | "harvest"
  | "post-harvest";

export interface Field {
  id: string;
  farmId: string;
  name: string; // "Field 1"
  acres: number;
  activeCropCycleId?: string;
}

export interface CropCycle {
  id: string;
  fieldId: string;
  crop: string; // "Tomato"
  variety?: string;
  sowingDate: ISODate;
  stage: CropStage;
  harvestWindow: { start: ISODate; end: ISODate };
  /** Expected harvest in this window, tonnes. */
  expectedYieldTonnes: number;
  expectedGrade: "A" | "B" | "C";
}

/** Crop-stage specific agronomy thresholds used by the intelligence engine. */
export interface CropStageProfile {
  crop: string;
  stage: CropStage;
  /** Below this volumetric soil moisture (%) the crop is likely to need water. */
  minSoilMoisture: number;
  /** Typical drip application depth per irrigation event (mm). */
  irrigationDepthMm: number;
}

// ---------------------------------------------------------------------------
// Sensing & weather
// ---------------------------------------------------------------------------

export interface SensorReading {
  fieldId: string;
  at: ISODateTime;
  soilMoisturePct: number;
  soilTempC: number;
  airTempC: number;
  humidityPct: number;
  leafWetnessHours: number;
  /** 0–100 composite crop-health index. */
  cropHealthScore: number;
  source: DataSource;
}

export interface WeatherForecast {
  clusterId: string;
  issuedAt: ISODateTime;
  rainStartsAt: ISODateTime | null;
  rainProbabilityPct: number;
  rainfallMm: [number, number];
  maxTempC: number;
  minTempC: number;
  condition: string;
  /** Hours (local) of strong solar generation expected today. */
  solarPeak: [number, number];
  source: DataSource;
}

export interface IrrigationEvent {
  id: string;
  fieldId: string;
  scheduledAt: ISODateTime;
  durationHours: number;
  status: "scheduled" | "delayed" | "done" | "cancelled";
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export type ResourceKind =
  | "tractor"
  | "harvester"
  | "sprayer"
  | "drone"
  | "tiller"
  | "seeder"
  | "transport"
  | "cold-storage"
  | "irrigation";

export interface Machinery {
  id: string;
  kind: ResourceKind;
  name: string;
  ownerUserId: string;
  clusterId: string;
  village: string;
  ratePerHour: number; // INR, indicative
  status: "available" | "booked" | "maintenance";
  /** Owner-declared availability windows. */
  availableSlots?: AvailabilitySlot[];
  notes?: string;
  /** Marketplace details (spec §11). Defaults per kind fill anything left out. */
  description?: string;
  suitableCrops?: string[];
  serviceType?: ServiceType;
}

/** How a machine or technology is offered to farmers. */
export type ServiceType = "Rental with operator" | "Self-drive rental" | "Per-visit service" | "Subscription" | "Supply & install" | "Cluster shared service";

export interface AvailabilitySlot {
  date: ISODate;
  startHour: number;
  endHour: number;
}

export interface ResourceDemand {
  clusterId: string;
  kind: ResourceKind;
  date: ISODate;
  requested: number;
  available: number;
}

export type BookingStatus = "requested" | "accepted" | "declined" | "in-progress" | "completed";

/** Records seeded as demo activity from other cluster members carry `seeded`. */
interface Seedable {
  seeded?: boolean;
}

export interface Booking extends Seedable {
  id: string;
  machineryId: string;
  requesterUserId: string;
  date: ISODate;
  startHour: number;
  hours: number;
  purpose: string;
  estimatedCost: number;
  status: BookingStatus;
  createdAt: ISODateTime;
}

export type LabourSkill = "land-preparation" | "transplanting" | "weeding" | "spraying" | "irrigation" | "harvesting" | "grading-packing";

export interface LabourProfile {
  id: string;
  userId: string;
  label: string; // "Harvest crew · Hootagalli"
  leadName: string;
  skills: LabourSkill[];
  crewSize: number;
  village: string;
  dailyWage: number; // INR per worker, indicative
  /** Optional hourly rate per worker for short jobs, INR, indicative. */
  hourlyRate?: number;
  experienceYears: number;
  cropExperience: string[];
  /** Crew brings its own transport to the farm. */
  transport: boolean;
  availableFrom: ISODate;
  availability: "available" | "limited" | "booked";
  source: DataSource;
}

export interface LabourRequest extends Seedable {
  id: string;
  labourProfileId: string;
  requesterUserId: string;
  skill: LabourSkill;
  /** Crop and village the work is for; shared with the crew (spec §12). */
  crop?: string;
  location?: string;
  workers: number;
  date: ISODate;
  days: number;
  note: string;
  status: BookingStatus;
  createdAt: ISODateTime;
}

export interface Technology {
  id: string;
  name: string;
  category: "sensing" | "monitoring" | "irrigation" | "energy" | "application";
  summary: string;
  howItWorks: string[];
  /** How a small farm accesses it through the cluster. */
  access: string;
  indicativeCost: string;
  /** Marketplace details (spec §11). */
  providerUserId: string;
  location: string;
  availability: string;
  serviceType: ServiceType;
  suitableCrops: string[];
}

export interface ServiceRequest extends Seedable {
  id: string;
  technologyId: string;
  requesterUserId: string;
  note: string;
  status: "requested" | "scheduled" | "completed";
  createdAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Experts
// ---------------------------------------------------------------------------

/** Expert categories from spec §13. */
export type ExpertCategory =
  | "soil"
  | "crop"
  | "irrigation"
  | "pest"
  | "organic"
  | "precision"
  | "finance"
  | "market"
  | "export"
  | "post-harvest"
  | "food-processing";

export interface Expert {
  id: string;
  userId: string;
  name: string;
  category: ExpertCategory;
  title: string;
  expertise: string[];
  languages: string[];
  responseTime: string;
  consultationFee: number; // INR per session, indicative; questions are free via the cluster
  source: DataSource;
}

export interface Consultation extends Seedable {
  id: string;
  expertId: string;
  requesterUserId: string;
  kind: "question" | "consultation";
  topic: string;
  message: string;
  fieldId?: string;
  preferredDate?: ISODate;
  status: "sent" | "answered" | "scheduled" | "completed";
  createdAt: ISODateTime;
  /** The expert's recommendation. */
  answer?: string;
  scheduledAt?: ISODateTime;
  mode?: "call" | "field-visit";
  /** Summary written when the consultation is completed. */
  outcome?: string;
}

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

export type PostCategory = "announcement" | "alert" | "question" | "practice" | "story" | "resource";

/** A local farmer group run by a community organiser (spec §17). */
export interface CommunityGroup extends Seedable {
  id: string;
  name: string;
  village: string;
  focus: string;
  description: string;
  organiserUserId: string;
  /** Member count before this prototype's joins. */
  baseMembers: number;
  memberUserIds: string[];
  meets: string;
  createdAt: ISODateTime;
}

export type EventKind = "workshop" | "field-day" | "meeting" | "training";

export interface CommunityEvent extends Seedable {
  id: string;
  title: string;
  kind: EventKind;
  date: ISODate;
  startHour: number;
  village: string;
  groupId?: string;
  hostLabel: string;
  organiserUserId: string;
  description: string;
  seats: number;
  /** Registrations before this prototype's sign-ups. */
  baseRegistered: number;
  attendeeUserIds: string[];
  createdAt: ISODateTime;
}

export interface CommunityPost extends Seedable {
  id: string;
  authorUserId: string;
  authorLabel: string; // farm label for farmers, name/organisation for others
  authorRole: Role;
  category: PostCategory;
  title: string;
  body: string;
  createdAt: ISODateTime;
}

export interface CommunityReply extends Seedable {
  id: string;
  postId: string;
  authorUserId: string;
  authorLabel: string;
  authorRole: Role;
  body: string;
  createdAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Market
// ---------------------------------------------------------------------------

export interface BuyerRequirement {
  id: string;
  buyerUserId: string;
  buyerLabel: string; // "Mysuru retail aggregator"
  crop: string;
  grade: "A" | "B" | "C";
  quantityTonnes: number;
  window: { start: ISODate; end: ISODate };
  deliveryLocation: string;
  indicativePricePerKg: [number, number];
  postedAt: ISODateTime;
  status: "open" | "matched" | "closed";
  source: DataSource;
}

export interface CropListing extends Seedable {
  id: string;
  farmId: string;
  farmLabel: string;
  cropCycleId: string;
  crop: string;
  grade: "A" | "B" | "C";
  quantityTonnes: number;
  harvestDate: ISODate;
  availableFrom: ISODate;
  expectedPricePerKg: number;
  location: string;
  photoCount: number;
  /** Set when the listing was offered against a specific buyer requirement. */
  requirementId?: string;
  status: "listed" | "offer-sent" | "interest-received" | "agreed" | "withdrawn";
  createdAt: ISODateTime;
  /** Set when a buyer and the farmer agree. No payment is processed in the prototype. */
  agreedWith?: { buyerUserId: string; buyerLabel: string; pricePerKg: number; quantityTonnes: number };
  /** Set when a buyer declined the farmer's offer on a requirement. */
  offerDeclinedBy?: string;
  method?: string;
  description?: string;
  availableUntil?: ISODate;
  hasVideo?: boolean;
  /** What the farmer chose to show buyers on this listing (spec §16, §19). */
  share?: { method: boolean; photos: boolean; village: boolean; name: boolean };
}

/** A buyer's interest in a farmer's listing. */
export interface MarketInterest {
  id: string;
  listingId: string;
  buyerUserId: string;
  buyerLabel: string;
  quantityTonnes: number;
  pricePerKg: number;
  message: string;
  status: "pending" | "accepted" | "declined";
  createdAt: ISODateTime;
}

export interface ClusterSupply {
  clusterId: string;
  crop: string;
  grade: "A" | "B" | "C";
  expectedTonnes: number;
  window: { start: ISODate; end: ISODate };
  source: DataSource;
}

// ---------------------------------------------------------------------------
// Intelligence
// ---------------------------------------------------------------------------

export type IntelligenceDomain = "water" | "energy" | "crop" | "harvest" | "market" | "resource";
export type Priority = "high" | "medium" | "low";

/** One fact the engine used — rendered in "Why this recommendation?". */
export interface Evidence {
  label: string;
  value: string;
  source: DataSource;
}

export interface Recommendation {
  id: string;
  domain: IntelligenceDomain;
  priority: Priority;
  /** Short suggestion, phrased as advice, never as a command. */
  title: string;
  /** What is happening? */
  situation: string;
  /** Why does it matter? */
  whyItMatters: string;
  /** Data behind the suggestion. */
  evidence: Evidence[];
  /** Potential impact, always indicative. */
  impact?: string;
  action: { label: string; to: string };
  fieldId?: string;
  /** All fields the suggestion covers (e.g. one harvest spread over two fields). */
  fieldIds?: string[];
  farmId?: string;
  /** What changes if the farmer accepts. Applied only on acceptance, reverted on undo. */
  effect?: IrrigationEffect;
  /** Numeric form of `impact`, used to aggregate impact across the cluster. Indicative. */
  impactEstimate?: { waterLitres?: number; gridKwhAvoided?: number };
}

export interface IrrigationEffect {
  kind: "reschedule-irrigation";
  eventId: string;
  newTime: ISODateTime;
  durationHours: number;
  summary: string; // "Delayed to tomorrow, 5:00 PM"
}

export type DecisionStatus = "accepted" | "ignored";

export interface Decision {
  recommendationId: string;
  status: DecisionStatus;
  at: ISODateTime;
}

export interface ClusterAlert {
  id: string;
  domain: IntelligenceDomain;
  priority: Priority;
  title: string;
  detail: string;
  /** Data behind the alert, shown on the cluster Intelligence screen. */
  evidence: Evidence[];
  action: { label: string; to: string };
  affectedFarms?: number;
}

// ---------------------------------------------------------------------------
// Farmer decision journey (AGRI CLUSTER master prompt §5–§18)
// ---------------------------------------------------------------------------

export type Level = "low" | "moderate" | "high";

/** What the farmer tells us in the step-by-step assessment. Only fields that change a later recommendation. */
export interface FarmAssessment {
  name: string;
  contact: string;
  location: string;
  landAcres: number;
  tenure: "owned" | "leased";
  currentCrop: string;
  previousCrop: string;
  soilType: "red" | "black" | "alluvial" | "sandy" | "laterite";
  soilTestDone: boolean;
  water: Level;
  irrigation: IrrigationType;
  electricity: "reliable" | "limited" | "none";
  solar: boolean;
  ownsMachinery: boolean;
  labourAvailable: Level;
  investment: number; // INR available
  needsLoan: boolean;
  experienceYears: number;
  techFamiliarity: Level;
}

/** Starting intention (§5): A = investment, B = income goal, C = guided. */
export type VisionMode = "investment" | "income" | "guided";

export interface Vision {
  mode: VisionMode;
  /** ₹ available (A) or ₹ income target (B). */
  amount?: number;
}

/** Crop catalogue entry. Indicative planning figures, not predictions. */
export interface CropProfile {
  id: string;
  name: string;
  season: string;
  growingDays: [number, number];
  water: Level;
  investmentPerAcre: [number, number]; // INR, indicative range
  labour: Level;
  harvest: string; // "Multiple pickings over 6–8 weeks"
  yieldPerAcreKg: [number, number]; // indicative range
  priceRangePerKg: [number, number]; // indicative
  markets: BuyerCategory[];
  suitedSoils: FarmAssessment["soilType"][];
  techSuitability: Level;
  risks: string[];
  demand: Level;
  methodIds: string[];
}

export type BuyerCategory = "Retailers" | "Restaurants" | "Processors" | "Wholesalers" | "Exporters" | "Institutions";

/** Farming method catalogue entry (§8). */
export interface MethodProfile {
  id: string;
  name: string;
  summary: string;
  investment: Level;
  waterImpact: string;
  labourImpact: string;
  technology: string[];
  considerations: string[];
  howItWorks: string[];
  benefits: string[];
  video: { title: string; durationSec: number };
  /** Resource ids this method typically needs (machinery kinds / technology ids). */
  needs: string[];
}

export type BudgetCategory =
  | "Seeds & planting material"
  | "Soil preparation"
  | "Irrigation"
  | "Inputs"
  | "Technology"
  | "Labour"
  | "Machinery"
  | "Transport"
  | "Storage"
  | "Reserve";

export interface BudgetLine {
  category: BudgetCategory;
  amount: number;
  note?: string;
}

/** The plan a farmer builds through the journey. */
export interface FarmPlan {
  assessment?: FarmAssessment;
  vision?: Vision;
  cropId?: string;
  methodId?: string;
  budget?: BudgetLine[];
  /** Equipment kinds the farmer chose to buy instead of renting (default: rent). */
  buy?: string[];
  /** Planting / transplanting date the calendar is built from. */
  plantDate?: ISODate;
  /** Steps the farmer has explicitly reviewed (market, resources). */
  reviewed?: string[];
  confirmedAt?: ISODateTime;
}

export interface CalendarTask {
  id: string;
  date: ISODate;
  title: string;
  stage: "prepare" | "plant" | "grow" | "protect" | "harvest" | "sell";
  resource?: string; // "Tractor", "Labour · planting", "Expert"
}

export interface MarketPoint {
  month: string; // "Oct"
  pricePerKg: number;
}

export interface MarketData {
  crop: string;
  current: [number, number];
  history: MarketPoint[]; // last 12 months, indicative
  seasonalNote: string;
  demand: Level;
  quality: string[];
  storage: string;
  transport: string;
  source: DataSource;
}

export interface SupportScheme {
  id: string;
  name: string;
  category: "Government scheme" | "Banking" | "Insurance" | "Training" | "Institutional";
  summary: string;
  relevantWhen: string; // why we are showing it
  /** Always "Check with the official source" in the prototype. Never fabricated. */
  eligibility: string;
  documents: string[];
  howToApply: string;
  source: { label: string; url?: string };
  lastUpdated?: ISODate;
  verified: boolean;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  userId: string; // recipient
  title: string;
  body?: string;
  link?: string;
  kind: "buyer" | "machinery" | "labour" | "expert" | "harvest" | "market" | "community" | "system";
  read: boolean;
  createdAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Cluster roster & map
// ---------------------------------------------------------------------------

/** Summary of one farm as the cluster sees it. Identified only by label (privacy). */
export interface ClusterFarm {
  id: string;
  label: string; // "Farm #27"
  village: string;
  acres: number;
  crop: string;
  stage: CropStage;
  grade: "A" | "B" | "C";
  harvestWindow: { start: ISODate; end: ISODate };
  expectedTonnes: number;
  soilMoisturePct: number;
  minSoilMoisture: number;
  healthScore: number;
  irrigationBeforeRain: boolean;
  possibleStress: boolean;
  solarPump: boolean;
  active: boolean;
  /** Position on the simulated (non-geographic) cluster map, 0–100. */
  pos: { x: number; y: number };
}

export type InfrastructureKind = "weather" | "water" | "machinery" | "storage" | "collection" | "market";

export interface InfrastructurePoint {
  id: string;
  kind: InfrastructureKind;
  name: string;
  detail: string;
  pos: { x: number; y: number };
}

export interface ExternalProvider {
  id: string;
  name: string;
  kind: ResourceKind;
  units: number;
  location: string;
  distanceKm: number;
  ratePerHour: number;
}

// ---------------------------------------------------------------------------
// Impact
// ---------------------------------------------------------------------------

export interface ImpactMetric {
  id: string;
  label: string;
  unit: string;
  baseline: number;
  current: number;
  /** Pilot target range, e.g. [15, 20] (% improvement). Illustrative, not guaranteed. */
  targetRange: [number, number];
  source: DataSource;
}
