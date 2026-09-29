import { useMemo } from "react";
import { useAppStore } from "../../store/AppStore";
import { useMachinery } from "../shared/useMerged";
import { experts } from "../../data/mock/experts";
import { farmLabelForUser } from "../../data/mock/farms";
import { commissionRates, type RevenueStream } from "../../data/pricing";

export interface RevenueRow {
  id: string;
  stream: RevenueStream;
  date: string;
  what: string;
  parties: string;
  value: number; // INR, transaction value
  commission: number; // INR, at the proposed rate
  status: string;
}

const round = (n: number) => Math.round(n);

/**
 * Proposed platform commission on confirmed transactions, worked out from the
 * records the app already keeps. Nothing is charged or collected.
 */
export function useRevenue() {
  const { bookings, listings, consultations } = useAppStore();
  const machinery = useMachinery();

  return useMemo(() => {
    const rows: RevenueRow[] = [];

    for (const b of bookings) {
      if (!["accepted", "in-progress", "completed"].includes(b.status)) continue;
      const m = machinery.find((x) => x.id === b.machineryId);
      rows.push({
        id: b.id,
        stream: "equipment",
        date: b.date,
        what: `${m?.name ?? "Equipment"} · ${b.hours} h`,
        parties: `${farmLabelForUser(b.requesterUserId)} → ${m ? (m.ownerUserId.startsWith("u-provider") ? "provider" : "private owner") : "owner"}`,
        value: b.estimatedCost,
        commission: round(b.estimatedCost * commissionRates.equipment.rate),
        status: b.status === "completed" ? "Completed" : b.status === "in-progress" ? "In progress" : "Confirmed",
      });
    }

    for (const l of listings) {
      if (l.status !== "agreed" || !l.agreedWith) continue;
      const value = l.agreedWith.quantityTonnes * 1000 * l.agreedWith.pricePerKg;
      rows.push({
        id: l.id,
        stream: "market",
        date: l.availableFrom,
        what: `${l.agreedWith.quantityTonnes} t ${l.crop.toLowerCase()} at ₹${l.agreedWith.pricePerKg}/kg`,
        parties: `${l.farmLabel} → ${l.agreedWith.buyerLabel}`,
        value,
        commission: round(value * commissionRates.market.rate),
        status: "Agreed",
      });
    }

    for (const c of consultations) {
      if (c.kind !== "consultation" || !["scheduled", "completed"].includes(c.status)) continue;
      const ex = experts.find((e) => e.id === c.expertId);
      if (!ex) continue;
      rows.push({
        id: c.id,
        stream: "expert",
        date: (c.scheduledAt ?? c.createdAt).slice(0, 10),
        what: `Consultation · ${ex.title}`,
        parties: `${farmLabelForUser(c.requesterUserId)} → ${ex.name}`,
        value: ex.consultationFee,
        commission: round(ex.consultationFee * commissionRates.expert.rate),
        status: c.status === "completed" ? "Completed" : "Scheduled",
      });
    }

    rows.sort((a, b) => b.date.localeCompare(a.date));
    const byStream = (Object.keys(commissionRates) as RevenueStream[]).map((s) => {
      const r = rows.filter((x) => x.stream === s);
      return { stream: s, count: r.length, value: r.reduce((t, x) => t + x.value, 0), commission: r.reduce((t, x) => t + x.commission, 0) };
    });
    return {
      rows,
      byStream,
      totalValue: rows.reduce((t, x) => t + x.value, 0),
      totalCommission: rows.reduce((t, x) => t + x.commission, 0),
    };
  }, [bookings, listings, consultations, machinery]);
}
