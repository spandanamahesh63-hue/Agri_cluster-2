import type { LucideIcon } from "lucide-react";
import { Droplets, Leaf, TrendingUp, Tractor, Wheat, Zap } from "lucide-react";
import type { IntelligenceDomain } from "../../types";
import type { Tone } from "../../components/ui/Badge";

export const domainMeta: Record<IntelligenceDomain, { label: string; icon: LucideIcon; tone: Tone }> = {
  water: { label: "Water", icon: Droplets, tone: "water" },
  energy: { label: "Energy", icon: Zap, tone: "energy" },
  crop: { label: "Crop health", icon: Leaf, tone: "crop" },
  harvest: { label: "Harvest", icon: Wheat, tone: "crop" },
  market: { label: "Market", icon: TrendingUp, tone: "market" },
  resource: { label: "Resources", icon: Tractor, tone: "resource" },
};
