import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError, fmtDate, money, pct, type Prediction } from "../api";
import ForecastResult from "../components/ForecastResult";
import PriceChart from "../components/PriceChart";
import { ErrorBox, Notice, PageHeader, SampleBadge, Spinner, Stat, useAsync } from "../components/ui";

export default function DeviceDetails() {
  const { id = "" } = useParams();
  const dev = useAsync(() => api.device(id), [id]);
  const hist = useAsync(() => api.history(id), [id]);
  const [pred, setPred] = useState<Prediction | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  const run = async () => {
    setBusy(true); setErr(null);
    try { setPred(await api.forecast(id, 3)); } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  if (dev.loading) return <Spinner />;
  if (dev.error || !dev.data) return <ErrorBox error={dev.error} />;
  const d = dev.data, s = hist.data?.stats;
  const cur = d.currency;
  const move = (m: { amount: number; pct: number; from_date: string; to_date: string } | null) => m ? `${money(Math.abs(m.amount), cur)} (${pct(m.pct)}) · ${fmtDate(m.from_date)} → ${fmtDate(m.to_date)}` : "None recorded";
  const insufficient = err instanceof ApiError && (err.code === "insufficient_history" || err.code === "no_price_history");

  return (
    <>
      <PageHeader title={d.name} sub={<>{d.brand} · {d.category} · {d.status} {hist.data?.has_sample_data && <SampleBadge />}</>}
        actions={<><Link className="btn" to="/devices">Back to devices</Link>
          <a className="btn" href={`/api/devices/${d.id}/history?format=csv`}>Download history CSV</a></>} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Latest known price" value={money(s?.current_price ?? d.latest_price, cur)} hint={s ? fmtDate(s.last_date) : "no history yet"} />
        <Stat label="Launch price" value={money(d.launch_price, cur)} hint={d.release_date ? `released ${fmtDate(d.release_date)}` : undefined} />
        <Stat label="Change since first record" value={pct(s?.pct_change)} hint={s ? `${money(s.abs_change, cur)}` : undefined} />
        <Stat label="Historical records" value={s?.records ?? 0} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <h2 className="mb-2 font-semibold">Price history</h2>
          {hist.loading ? <Spinner /> : hist.data && hist.data.history.length > 0 ? (
            <PriceChart currency={cur} history={hist.data.history.map((h) => [h.date, h.price])} />
          ) : <p className="py-8 text-center text-sm text-muted">No historical prices have been uploaded for this device yet.</p>}
        </div>
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">Specifications</h2>
          {Object.keys(d.specs).length === 0 ? <p className="text-sm text-muted">No specifications recorded.</p> : (
            <dl className="text-sm">{Object.entries(d.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-line/70 py-1.5"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>))}</dl>
          )}
        </div>
      </div>

      {s && (
        <div className="card mt-5 p-4">
          <h2 className="mb-2 font-semibold">Historical summary</h2>
          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="inline text-muted">Minimum: </dt><dd className="inline">{money(s.min_price, cur)} ({fmtDate(s.min_date)})</dd></div>
            <div><dt className="inline text-muted">Maximum: </dt><dd className="inline">{money(s.max_price, cur)} ({fmtDate(s.max_date)})</dd></div>
            <div><dt className="inline text-muted">Average: </dt><dd className="inline">{money(s.avg_price, cur)}</dd></div>
            <div><dt className="inline text-muted">Period: </dt><dd className="inline">{fmtDate(s.first_date)} – {fmtDate(s.last_date)}</dd></div>
            <div><dt className="inline text-muted">Highest drop: </dt><dd className="inline">{move(s.highest_drop)}</dd></div>
            <div><dt className="inline text-muted">Highest increase: </dt><dd className="inline">{move(s.highest_increase)}</dd></div>
          </dl>
        </div>
      )}

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">3-year price forecast</h2>
          <button className="btn btn-primary" onClick={run} disabled={busy}>{busy ? "Forecasting…" : pred ? "Run again" : "Generate forecast"}</button>
        </div>
        <ErrorBox error={err} />
        {insufficient && <p className="mt-2 text-sm text-muted">A forecast needs enough recorded prices. An administrator can upload more history under Datasets.</p>}
        {pred ? <ForecastResult p={pred} /> : !err && <Notice tone="info">Generate a forecast to see the estimated price after 1, 2 and 3 years, with downloadable CSV and PDF.</Notice>}
      </section>
    </>
  );
}
