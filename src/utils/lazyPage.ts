import { lazy, type ComponentType } from "react";

/** Code-split a named page export: `const X = lazyPage(() => import("./X"), "X")`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage<M extends Record<K, ComponentType<any>>, K extends keyof M>(loader: () => Promise<M>, name: K) {
  return lazy<M[K]>(async () => ({ default: (await loader())[name] }));
}
