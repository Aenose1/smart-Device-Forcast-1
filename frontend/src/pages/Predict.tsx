import { useState } from "react";
import { api, type Device, type Prediction } from "../api";
import DeviceCombobox from "../components/DeviceCombobox";
import ForecastResult from "../components/ForecastResult";
import { ErrorBox, Notice, PageHeader } from "../components/ui";

export default function Predict() {
  const [device, setDevice] = useState<Device | null>(null);
  const [category, setCategory] = useState("");
  const [years, setYears] = useState(3);
  const [pred, setPred] = useState<Prediction | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<unknown>(null);

  const run = async () => {
    if (!device) return;
    setBusy(true); setErr(null); setPred(null);
    try { setPred(await api.forecast(device.id, years)); } catch (e) { setErr(e); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="New forecast" sub="Choose a device and a forecast period. The result is saved to your history." />
      <div className="card mb-5 grid gap-4 p-4 md:grid-cols-6">
        <div><label className="label" htmlFor="c">Category</label>
          <select id="c" className="input" value={category} onChange={(e) => { setCategory(e.target.value); setDevice(null); }}>
            <option value="">Laptops and smartphones</option><option>Laptop</option><option>Smartphone</option></select></div>
        <div className="md:col-span-3"><label className="label">Device</label>
          <DeviceCombobox key={category} category={category || undefined} selected={device} onSelect={setDevice} /></div>
        <div><label className="label" htmlFor="y">Forecast period</label>
          <select id="y" className="input" value={years} onChange={(e) => setYears(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{y} year{y > 1 ? "s" : ""}</option>)}</select></div>
        <div className="flex items-end"><button className="btn btn-primary w-full" disabled={!device || busy} onClick={run}>{busy ? "Working…" : "Estimate prices"}</button></div>
        {device && <p className="text-sm text-muted md:col-span-6">Selected: <b className="text-ink">{device.name}</b> ({device.brand}, {device.category}). The forecast horizon is {years} year{years > 1 ? "s" : ""}; it does not assume the device is sold that long.</p>}
      </div>
      <ErrorBox error={err} />
      {!pred && !err && <Notice tone="info">Forecasts are estimates based on historical price patterns. They may differ from actual market prices.</Notice>}
      {pred && <ForecastResult p={pred} />}
    </>
  );
}
