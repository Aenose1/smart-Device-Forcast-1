import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, fmtDate, money, pct, type Mover } from "../api";
import { ErrorBox, PageHeader, Spinner, Stat, TrendBadge, useAsync } from "../components/ui";

function Movers({ title, rows }: { title: string; rows: Mover[] }) {
  const data = rows.map((r) => ({ name: r.name.length > 22 ? r.name.slice(0, 21) + "…" : r.name, pct: r.pct_change }));
  return (
    <div className="card p-4">
      <h2 className="mb-2 font-semibold">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-muted">No devices in this group yet.</p> : (
        <>
          <div style={{ height: 30 + rows.length * 34 }} role="img" aria-label={title}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} stroke="#e3e8ea" />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
                <Bar dataKey="pct" fill={rows[0].pct_change < 0 ? "#0e5a6b" : "#b46a00"} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="mt-2 w-full"><tbody>
            {rows.map((r) => (
              <tr key={r.id}><td className="td"><Link className="text-accent hover:underline" to={`/devices/${r.id}`}>{r.name}</Link></td>
                <td className="td text-right text-muted">{money(r.first_price, r.currency)} → {money(r.latest_price, r.currency)}</td>
                <td className="td text-right font-medium">{pct(r.pct_change)}</td></tr>
            ))}
          </tbody></table>
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data, error, loading } = useAsync(() => api.dashboard(), []);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox error={error} />;
  return (
    <>
      <PageHeader title="Dashboard" sub="Catalogue overview and your recent forecasts." actions={<Link className="btn btn-primary" to="/predict">New forecast</Link>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Total devices" value={data.total_devices} />
        <Stat label="Laptops" value={data.laptops} />
        <Stat label="Smartphones" value={data.smartphones} />
        <Stat label="Historical records" value={data.history_records.toLocaleString()} />
        <Stat label="Avg. price change" value={pct(data.average_price_change)} hint="first vs latest recorded price" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Movers title="Largest price decreases" rows={data.top_decreases} />
        <Movers title="Largest price increases" rows={data.top_increases} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">Price records by month</h2>
          {data.records_by_month.length === 0 ? <p className="text-sm text-muted">No price history has been uploaded yet.</p> : (
            <div style={{ height: 220 }} role="img" aria-label="Records by month">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.records_by_month}><CartesianGrid vertical={false} stroke="#e3e8ea" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} minTickGap={24} /><YAxis tick={{ fontSize: 12 }} width={36} allowDecimals={false} />
                  <Tooltip /><Bar dataKey="records" fill="#0e5a6b" isAnimationActive={false} /></BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">Your recent forecasts</h2>
          {data.recent_predictions.length === 0 ? <p className="text-sm text-muted">You haven't run a forecast yet. <Link className="text-accent underline" to="/predict">Start one</Link>.</p> : (
            <table className="w-full"><tbody>
              {data.recent_predictions.map((p) => (
                <tr key={p.id}><td className="td"><Link className="text-accent hover:underline" to={`/predictions/${p.id}`}>{p.device_name}</Link><div className="text-xs text-muted">{fmtDate(p.created_at)}</div></td>
                  <td className="td text-right">{p.overall_trend && <TrendBadge trend={p.overall_trend} />}</td></tr>
              ))}
            </tbody></table>
          )}
        </div>
      </div>
    </>
  );
}
