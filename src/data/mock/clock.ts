// The demo runs on a fixed clock so the story (rain in ~10 hours, harvest in
// 7 days, …) stays coherent no matter when the prototype is presented. Real
// accounts use today's date: services/mode.ts switches these (they are live
// bindings, so every importer reads the current values).

const DEMO = new Date("2026-09-27T08:30:00+05:30");
const isoDay = (d: Date) => new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10); // India date

export let DEMO_NOW = DEMO;
export let DEMO_TODAY = "2026-09-27";
export let DEMO_TOMORROW = "2026-09-28";

export function setClockToNow() {
  DEMO_NOW = new Date();
  DEMO_TODAY = isoDay(DEMO_NOW);
  DEMO_TOMORROW = isoDay(new Date(DEMO_NOW.getTime() + 86_400_000));
}

export function setClockToDemo() {
  DEMO_NOW = DEMO;
  DEMO_TODAY = "2026-09-27";
  DEMO_TOMORROW = "2026-09-28";
}
