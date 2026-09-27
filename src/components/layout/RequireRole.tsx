import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { roleHome } from "../navigation/navConfig";

/**
 * Role-based access: signed-out users go to login; other roles go to their own home.
 * The guided demo can ask for a role switch on arrival (`state.demoSwitchTo`).
 */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, signInAsDemo } = useAppStore();
  const location = useLocation();
  const switching = (location.state as { demoSwitchTo?: Role } | null)?.demoSwitchTo === role && session?.role !== role;

  useEffect(() => {
    if (switching) signInAsDemo(role);
  }, [switching, role, signInAsDemo]);

  if (switching) return null;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (session.role !== role) return <Navigate to={roleHome(session.role)} replace />;
  return children;
}
