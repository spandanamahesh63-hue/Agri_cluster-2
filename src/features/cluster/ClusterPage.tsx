import type { ReactNode } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorState, PageSkeleton } from "../../components/ui/states";
import { useClusterView, type ClusterView } from "./useClusterView";

interface ClusterPageProps {
  title: ReactNode;
  description: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  children: (view: ClusterView) => ReactNode;
}

/** Loads the live cluster view and handles loading / error for every cluster screen. */
export function ClusterPage({ title, description, eyebrow, actions, children }: ClusterPageProps) {
  const state = useClusterView();
  const header = <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />;
  if (state.status === "loading") return <PageSkeleton />;
  if (state.status === "error")
    return (
      <>
        {header}
        <ErrorState message={state.error.message} onRetry={state.retry} />
      </>
    );
  return (
    <>
      {header}
      {children(state.data)}
    </>
  );
}
