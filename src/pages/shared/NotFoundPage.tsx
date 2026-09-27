import { Compass } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { roleHome } from "../../components/navigation/navConfig";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/states";

export function NotFoundPage() {
  const { session } = useAppStore();
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <EmptyState
        icon={<Compass aria-hidden className="size-5" />}
        title="Page not found"
        description="The page you were looking for does not exist or has moved."
        action={
          <ButtonLink to={session ? roleHome(session.role) : "/login"} variant="secondary" size="sm">
            {session ? "Back to dashboard" : "Go to sign in"}
          </ButtonLink>
        }
      />
    </div>
  );
}
