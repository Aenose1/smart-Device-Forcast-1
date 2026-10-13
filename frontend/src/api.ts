export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: any) {
    super(message);
  }
}

export interface User { id: number; email: string; full_name: string; role: "user" | "admin" }
export interface Device {
  id: string; name: string; brand: string; category: "Laptop" | "Smartphone"; release_date: string | null;
  launch_price: number; current_price: number | null; latest_price: number; latest_price_date: string | null;
  currency: string; status: string; specs: Record<string, string>;
}
export interface Paged<T> { items: T[]; total: number; page: number; page_size: number }
export interface Stats {
  records: number; first_date: string; last_date: string; current_price: number; min_price: number; min_date: string;
  max_price: number; max_date: string; avg_price: number; abs_change: number; pct_change: number | null;
  highest_drop: Move | null; highest_increase: Move | null;
}
export interface Move { amount: number; pct: number; from_date: string; to_date: string }
export interface HistoryResponse {
  device_id: string; currency: string; has_sample_data: boolean; stats: Stats | null;
  history: { date: string; price: number; source: string; is_sample: boolean }[];
}
export interface ForecastRow {
  horizon_months: number; label: string; forecast_date: string; predicted_price: number; lower: number; upper: number;
  abs_change: number; pct_change: number; trend: string;
}
export interface Candidate { name: string; status: string; mae?: number; rmse?: number; mape?: number | null; r2?: number | null; selected: boolean }
export interface Prediction {
  id: number; kind: string; device_id: string | null; device_name: string; brand: string; category: string; currency: string;
  current_price: number; as_of: string; horizons: number[]; results: ForecastRow[]; overall_trend: string | null;
  overall_pct_change: number | null; model_type: string; is_sample: boolean; created_at: string; disclaimer: string;
  path?: { date: string; predicted: number; lower: number; upper: number }[];
  history?: [string, number][]; stats?: Stats; warnings?: string[];
  model_info?: {
    model_type: string; trained_at: string; dataset_version: string; n_observations: number; category: string;
    metrics: { mae: number; rmse: number; mape: number | null; r2: number | null; n_test: number; validation: string };
    candidates: Candidate[]; feature_set: { model_features: string[]; category_spec_features: string[] };
    interval: { level: number; method: string };
  };
}
export interface Dashboard {
  total_devices: number; laptops: number; smartphones: number; history_records: number; my_predictions: number;
  average_price_change: number | null; top_decreases: Mover[]; top_increases: Mover[];
  records_by_month: { month: string; records: number }[]; recent_predictions: Prediction[];
}
export interface Mover { id: string; name: string; brand: string; category: string; currency: string; first_price: number; latest_price: number; pct_change: number }
export interface DatasetRow {
  id: number; filename: string; is_sample: boolean; status: string; rows_total: number; rows_valid: number; rows_invalid: number;
  rows_duplicate: number; created_at: string;
}
export interface ValidationReport {
  total_rows: number; valid_rows: number; invalid_rows: number; duplicates_in_file: number; duplicates_existing: number;
  missing_values: number; invalid_device_ids: string[]; error_count: number; errors_truncated: boolean;
  errors: { row: number; column: string | null; code: string; message: string }[];
}
export interface ModelRow {
  id: number; device_id: string; device_name: string; category: string; model_type: string; trained_at: string;
  dataset_version: string; n_observations: number; is_active: boolean; metrics: Record<string, any>; candidates: Candidate[];
}
export interface LogRow { id: number; created_at: string; event: string; status: string; message: string; device_id: string | null; user: string | null; duration_ms: number }

async function request<T>(method: string, url: string, body?: unknown, form?: FormData): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method, credentials: "same-origin",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, "network", "Cannot reach the server. Check your connection and try again.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && !url.includes("/auth/")) window.dispatchEvent(new Event("auth:expired"));
    const fieldMsg = data?.details?.errors?.map((e: any) => `${e.field}: ${e.message}`).join("; ");
    throw new ApiError(res.status, data?.code ?? "error", fieldMsg || data?.detail || "Request failed.", data?.details);
  }
  return data as T;
}

const qs = (p: Record<string, string | number | undefined | null>) => {
  const u = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v !== undefined && v !== null && v !== "" && u.set(k, String(v)));
  const s = u.toString();
  return s ? `?${s}` : "";
};

export const api = {
  register: (b: { email: string; full_name: string; password: string }) => request<User>("POST", "/api/auth/register", b),
  login: (b: { email: string; password: string }) => request<User>("POST", "/api/auth/login", b),
  logout: () => request<void>("POST", "/api/auth/logout"),
  me: () => request<User>("GET", "/api/auth/me"),
  dashboard: () => request<Dashboard>("GET", "/api/dashboard"),
  devices: (p: Record<string, any>) => request<Paged<Device>>("GET", `/api/devices/search${qs(p)}`),
  brands: (category?: string) => request<string[]>("GET", `/api/devices/brands${qs({ category })}`),
  device: (id: string) => request<Device>("GET", `/api/devices/${encodeURIComponent(id)}`),
  history: (id: string) => request<HistoryResponse>("GET", `/api/devices/${encodeURIComponent(id)}/history`),
  forecast: (device_id: string, years: number) => request<Prediction>("POST", "/api/forecast", { device_id, years }),
  predict: (device_id: string, months: number) => request<Prediction>("POST", "/api/predict", { device_id, months }),
  predictions: (p: Record<string, any>) => request<Paged<Prediction>>("GET", `/api/predictions${qs(p)}`),
  prediction: (id: number | string) => request<Prediction>("GET", `/api/predictions/${id}`),
  admin: {
    overview: () => request<Record<string, number>>("GET", "/api/admin/overview"),
    saveDevice: (b: any, editId?: string) =>
      editId ? request<Device>("PUT", `/api/admin/devices/${encodeURIComponent(editId)}`, b) : request<Device>("POST", "/api/admin/devices", b),
    deleteDevice: (id: string) => request<void>("DELETE", `/api/admin/devices/${encodeURIComponent(id)}`),
    datasets: () => request<DatasetRow[]>("GET", "/api/admin/datasets"),
    upload: (file: File, isSample: boolean) => {
      const f = new FormData(); f.append("file", file); f.append("is_sample", String(isSample));
      return request<{ dataset: DatasetRow; report: ValidationReport }>("POST", "/api/admin/dataset/upload", undefined, f);
    },
    validate: (file: File) => { const f = new FormData(); f.append("file", file); return request<ValidationReport>("POST", "/api/admin/dataset/validate", undefined, f); },
    models: () => request<{ total: number; items: ModelRow[] }>("GET", "/api/admin/models"),
    train: (b: { device_id?: string; category?: string }) =>
      request<{ trained: { device_id: string; device_name: string; model_type: string }[]; failed: { device_id: string; device_name: string; reason: string }[] }>("POST", "/api/admin/models/train", b),
    logs: (status?: string) => request<{ total: number; items: LogRow[] }>("GET", `/api/admin/prediction-logs${qs({ status })}`),
  },
};

export function money(v: number | null | undefined, currency = "INR"): string {
  if (v === null || v === undefined) return "—";
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
  } catch { return `${currency} ${Math.round(v).toLocaleString()}`; }
}
export const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`);
export const fmtNum = (v: number | null | undefined, d = 2) => (v === null || v === undefined ? "n/a" : v.toLocaleString(undefined, { maximumFractionDigits: d }));
export const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const modelLabel = (n: string) => n.replace(/_/g, " ");
