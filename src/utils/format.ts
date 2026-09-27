const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN");

export const formatINR = (value: number) => inr.format(value);
export const formatNumber = (value: number) => num.format(value);

/** Rounds to a "human" figure: 36,423 → 36,000. */
export function roughly(value: number): number {
  if (value >= 10000) return Math.round(value / 1000) * 1000;
  if (value >= 1000) return Math.round(value / 100) * 100;
  return Math.round(value);
}

export const formatLitres = (litres: number) => `${formatNumber(roughly(litres))} L`;

/** "1 acre", "2.5 acres". */
export const formatAcres = (acres: number) => `${acres} acre${acres === 1 ? "" : "s"}`;

/** Farm-scale harvests read better in kg: 2 → "2,000 kg". */
export const formatKg = (tonnes: number) => `${formatNumber(Math.round(tonnes * 1000))} kg`;

export function formatHour(hour: number): string {
  const h = ((hour + 11) % 12) + 1;
  return `${h}:00 ${hour < 12 ? "AM" : "PM"}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  return new Date(iso).toLocaleDateString("en-IN", { ...opts, timeZone: "Asia/Kolkata" });
}

/** "4–7 Oct" style range. */
export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} ${formatDate(end, { month: "short" })}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export const hoursBetween = (from: Date, to: Date) => (to.getTime() - from.getTime()) / 36e5;
export const daysBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / 864e5);

export function greeting(now: Date): string {
  const hour = Number(now.toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
