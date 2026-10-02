import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAppStore } from "../../store/AppStore";
import { roleHome } from "../../components/navigation/navConfig";
import {
  accountsEnabled,
  currentUserId,
  friendlyAuthError,
  loadProfile,
  signOutAccount,
  supabase,
  type Profile,
} from "../../services/auth/accounts";

export type AccountState =
  | { status: "off" }
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "error"; error: string }
  | { status: "needs-profile"; userId: string }
  | { status: "pending" | "rejected" | "ready"; userId: string; profile: Profile };

interface AccountContext {
  account: AccountState;
  /** Re-read who is signed in and their profile (after verifying a code, or to check for approval). */
  refresh: () => Promise<AccountState>;
  /** A profile was just created or changed on this device. */
  setProfile: (p: Profile) => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AccountContext | null>(null);

const fromProfile = (userId: string, profile: Profile | null): AccountState =>
  !profile
    ? { status: "needs-profile", userId }
    : { status: profile.status === "approved" ? "ready" : profile.status, userId, profile };

/** Where a person should be, given their account. */
export function accountHome(a: AccountState): string {
  if (a.status === "needs-profile") return "/welcome";
  if (a.status === "pending" || a.status === "rejected") return "/account/status";
  if (a.status === "ready") return roleHome(a.profile.role);
  return "/login";
}

/**
 * Keeps the signed-in account (Supabase Auth + profile) and, once a person is
 * approved, signs them into the app with their real role. Does nothing unless
 * real accounts are switched on.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const { session, signInReal, signOut: signOutApp } = useAppStore();
  const [account, setAccount] = useState<AccountState>(accountsEnabled ? { status: "loading" } : { status: "off" });
  const seq = useRef(0);

  const refresh = useCallback(async (): Promise<AccountState> => {
    if (!accountsEnabled) return { status: "off" };
    const mine = ++seq.current;
    let next: AccountState;
    try {
      const userId = await currentUserId();
      next = userId ? fromProfile(userId, await loadProfile(userId)) : { status: "signed-out" };
    } catch (e) {
      next = { status: "error", error: friendlyAuthError(e) };
    }
    if (mine === seq.current) setAccount(next);
    return next;
  }, []);

  useEffect(() => {
    if (!accountsEnabled) return;
    void refresh();
    // Supabase advises against awaiting its own calls inside this callback.
    const { data } = supabase().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setAccount({ status: "signed-out" });
      else if (event === "SIGNED_IN") setTimeout(() => void refresh(), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  // Approved people are signed into the app with their own role and name;
  // a real session ends when the account signs out.
  useEffect(() => {
    if (account.status === "ready") {
      const { id, role, name } = account.profile;
      if (session?.mode !== "real" || session.userId !== id || session.role !== role || session.name !== name) signInReal({ userId: id, role, name });
    } else if (account.status !== "loading" && account.status !== "error" && session?.mode === "real") {
      signOutApp();
    }
  }, [account, session, signInReal, signOutApp]);

  const value = useMemo<AccountContext>(
    () => ({
      account,
      refresh,
      setProfile: (p) => setAccount(fromProfile(p.id, p)),
      signOut: async () => {
        if (accountsEnabled) await signOutAccount().catch(() => undefined);
        setAccount(accountsEnabled ? { status: "signed-out" } : { status: "off" });
        signOutApp();
      },
    }),
    [account, refresh, signOutApp],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount(): AccountContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAccount must be used inside <AccountProvider>");
  return c;
}
