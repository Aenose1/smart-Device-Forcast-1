import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { Icon, type IconName } from "../components/Icon";
import { Logo } from "../components/SiteNav";
import { ErrorBox, Notice } from "../components/ui";

/** Tells the user straight away if the API is unreachable, instead of failing only when they press the button. */
function BackendStatus() {
  const [down, setDown] = useState(false);
  useEffect(() => {
    let live = true;
    api.health().then(() => live && setDown(false)).catch(() => live && setDown(true));
    return () => { live = false; };
  }, []);
  if (!down) return null;
  return <div className="mb-4"><Notice>The server is not responding. Start the backend (<code>uvicorn backend.app.main:app --port 8000</code>) and reload this page.</Notice></div>;
}

function Shell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <div className="mt-6"><BackendStatus />{children}</div>
          <p className="mt-6 text-sm text-muted">{footer}</p>
        </div>
        <p className="text-xs text-muted">Forecasts are estimates, not guaranteed prices. <Link className="underline" to="/about">About</Link></p>
      </div>
      <aside className="hero-gradient relative hidden overflow-hidden text-white lg:block" aria-label="Product overview">
        <div className="bg-tech-circuit absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-center gap-8 p-12">
          <img src="/images/art/hero-devices.svg" alt="" width={640} height={480} className="mx-auto w-full max-w-lg drop-shadow-2xl" />
          <div className="mx-auto max-w-md text-center">
            <h2 className="text-2xl font-semibold">Know what a device will cost, before you buy</h2>
            <ul className="mt-5 grid gap-2 text-left text-sm text-slate-200">
              {([["History", "Recorded price history for smartphones and laptops"], ["Brain", "Models chosen on held-out data, error shown"], ["TrendingUp", "1 to 5-year estimates with an uncertainty range"]] as [IconName, string][]).map(([i, t]) => (
                <li key={t} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"><Icon name={i} className="h-4 w-4 shrink-0 text-teal-300" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, minLength, maxLength }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; minLength?: number; maxLength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Icon name="Lock" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
      <input id={id} className="input pl-9 pr-10" type={show ? "text" : "password"} autoComplete={autoComplete} required minLength={minLength} maxLength={maxLength}
        value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="absolute right-2 top-1.5 rounded-lg p-1 text-muted hover:text-ink" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>
        <Icon name={show ? "EyeOff" : "Eye"} className="h-4 w-4" />
      </button>
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
    <Shell title="Welcome back" subtitle="Sign in to see forecasts and your history." footer={<>No account? <Link className="font-medium text-indigo-600 underline" to="/register">Create one</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox error={error} />
        <div><label className="label" htmlFor="email">E-mail</label>
          <div className="relative"><Icon name="Mail" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input id="email" className="input pl-9" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
        <div><label className="label" htmlFor="pw">Password</label><PasswordInput id="pw" value={password} onChange={setPassword} autoComplete="current-password" /></div>
        <button className="btn btn-primary w-full !py-2.5" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
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
  const okLen = f.password.length >= 8, okMix = /[A-Za-z]/.test(f.password) && /\d/.test(f.password);
  return (
    <Shell title="Create your account" subtitle="Free. Takes a few seconds." footer={<>Already registered? <Link className="font-medium text-indigo-600 underline" to="/login">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox error={error} />
        <div><label className="label" htmlFor="name">Full name</label>
          <div className="relative"><Icon name="User" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input id="name" className="input pl-9" required maxLength={120} autoComplete="name" value={f.full_name} onChange={set("full_name")} /></div></div>
        <div><label className="label" htmlFor="email">E-mail</label>
          <div className="relative"><Icon name="Mail" className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <input id="email" className="input pl-9" type="email" autoComplete="email" required value={f.email} onChange={set("email")} /></div></div>
        <div>
          <label className="label" htmlFor="pw">Password</label>
          <PasswordInput id="pw" value={f.password} onChange={(v) => setF({ ...f, password: v })} autoComplete="new-password" minLength={8} maxLength={72} />
          <ul className="mt-2 space-y-1 text-xs">
            {([[okLen, "At least 8 characters"], [okMix, "A letter and a digit"]] as [boolean, string][]).map(([ok, t]) => (
              <li key={t} className={`flex items-center gap-1.5 ${ok ? "text-teal-700" : "text-muted"}`}><Icon name={ok ? "Check" : "Info"} className="h-3.5 w-3.5" />{t}</li>
            ))}
          </ul>
        </div>
        <button className="btn btn-primary w-full !py-2.5" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
      </form>
    </Shell>
  );
}
