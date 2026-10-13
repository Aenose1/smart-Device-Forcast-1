import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { ErrorBox } from "../components/ui";

function Shell({ title, children, footer }: { title: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center p-5">
      <div className="card w-full max-w-sm p-6">
        <Link to="/" className="text-sm text-muted hover:underline">Device Price Forecasting</Link>
        <h1 className="mb-5 mt-1 text-2xl font-semibold">{title}</h1>
        {children}
        <p className="mt-5 text-sm text-muted">{footer}</p>
      </div>
    </div>
  );
}

export function Login() {
  const { setUser } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/dashboard";
  const [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null), [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    try { setUser(await api.login({ email, password })); nav(from, { replace: true }); } catch (err) { setError(err); } finally { setBusy(false); }
  };
  return (
    <Shell title="Sign in" footer={<>No account? <Link className="text-accent underline" to="/register">Create one</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox error={error} />
        <div><label className="label" htmlFor="email">E-mail</label><input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="pw">Password</label><input id="pw" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { setUser } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState<unknown>(null), [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    try { setUser(await api.register(f)); nav("/dashboard", { replace: true }); } catch (err) { setError(err); } finally { setBusy(false); }
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Shell title="Create account" footer={<>Already registered? <Link className="text-accent underline" to="/login">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox error={error} />
        <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input" required maxLength={120} value={f.full_name} onChange={set("full_name")} /></div>
        <div><label className="label" htmlFor="email">E-mail</label><input id="email" className="input" type="email" autoComplete="email" required value={f.email} onChange={set("email")} /></div>
        <div>
          <label className="label" htmlFor="pw">Password</label>
          <input id="pw" className="input" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={f.password} onChange={set("password")} />
          <p className="mt-1 text-xs text-muted">At least 8 characters, with a letter and a digit.</p>
        </div>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      </form>
    </Shell>
  );
}
