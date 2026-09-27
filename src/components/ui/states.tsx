import clsx from "clsx";
import type { ReactNode } from "react";
import { CircleAlert, Inbox, RotateCw } from "lucide-react";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("animate-pulse rounded-md bg-sunken", className)} />;
}

/** Generic page-level loading placeholder. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-6">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-56" />
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx("flex flex-col items-center px-6 py-12 text-center", className)}>
      <div className="mb-3 grid size-10 place-items-center rounded-full bg-sunken text-ink-subtle">
        {icon ?? <Inbox aria-hidden className="size-5" />}
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-line bg-surface">
      <EmptyState
        icon={<CircleAlert aria-hidden className="size-5 text-danger" />}
        title="Something went wrong. Please try again."
        description={message}
        action={
          onRetry && (
            <Button variant="secondary" size="sm" icon={<RotateCw aria-hidden className="size-3.5" />} onClick={onRetry}>
              Try again
            </Button>
          )
        }
      />
    </div>
  );
}
