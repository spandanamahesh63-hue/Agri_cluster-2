// Which world the app is showing: the demo (sample cluster, fixed clock) or a
// real account (only real people's records, today's date). Set by the store when
// someone signs in; read by modules that aren't React components.

import { setClockToNow, setClockToDemo } from "../data/mock/clock";
import type { Member } from "./storage/realData";

let real = false;
let members: Member[] = [];

export const isRealMode = () => real;

export function setRealMode(on: boolean) {
  real = on;
  if (on) setClockToNow();
  else {
    setClockToDemo();
    members = [];
  }
}

/** The member directory for real accounts (names, roles, places). */
export const realMembers = () => members;
export function setRealMembers(list: Member[]) {
  members = list;
}
export const memberById = (id: string) => members.find((m) => m.id === id);
