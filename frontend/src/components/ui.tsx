import { useEffect, useState, type ReactNode } from "react";
import { ApiError } from "../api";

export const Spinner = ({ label = "Loading…" }: { label?: string }) => (
  <div role="status" className="py-10 text-center text-sm text-muted">{label}</div>
);

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  const msg = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
  return <div role="alert" className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{msg}</div>;
}

export const Notice = ({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "info" }) => (
  <div className={`rounded-md border px-3 py-2 text-sm ${tone === "warn" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-sky-200 bg-sky-50 text-sky-900"}`}>{children}</div>
);

export const Disclaimer = () => (
  <p className="text-xs leading-relaxed text-muted">
    This prediction is based on historical price patterns and may differ from actual market prices. Figures are estimates, not guarantees.
  </p>
);

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export const PageHeader = ({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const TrendBadge = ({ trend }: { trend: string }) => {
  const dec = trend.includes("decrease"), inc = trend.includes("increase");
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${dec ? "bg-sky-100 text-sky-900" : inc ? "bg-amber-100 text-amber-900" : "bg-gray-100 text-gray-700"}`}>
      <span aria-hidden>{dec ? "▼" : inc ? "▲" : "■"}</span>{trend}
    </span>
  );
};

export const SampleBadge = () => (
  <span className="rounded border border-amber-400 bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">SAMPLE / DEMO DATA</span>
);

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true); setError(null);
    fn().then((d) => live && setData(d)).catch((e) => live && setError(e)).finally(() => live && setLoading(false));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, error, loading, reload: () => setTick((t) => t + 1) };
}
