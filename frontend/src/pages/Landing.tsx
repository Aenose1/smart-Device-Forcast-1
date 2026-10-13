import { Link } from "react-router-dom";
import { useAuth } from "../auth";

/** Illustrative only: a schematic of what the product shows, not real data. */
function Schematic() {
  return (
    <svg viewBox="0 0 520 260" className="w-full" role="img" aria-label="Schematic: historical price line followed by a dashed estimate with a widening range">
      <rect width="520" height="260" fill="#fff" rx="8" />
      {[50, 100, 150, 200].map((y) => <line key={y} x1="30" x2="500" y1={y} y2={y} stroke="#e3e8ea" />)}
      <path d="M30 60 C 90 70, 120 78, 170 96 S 240 120, 270 128" fill="none" stroke="#0e5a6b" strokeWidth="3" />
      <path d="M270 128 L270 128 C 330 140, 400 158, 500 176 L500 120 C 400 118, 330 126, 270 128 Z" fill="#b46a00" opacity="0.14" />
      <path d="M270 128 C 330 142, 400 160, 500 178" fill="none" stroke="#b46a00" strokeWidth="3" strokeDasharray="8 6" />
      <line x1="270" x2="270" y1="30" y2="230" stroke="#5b6873" strokeDasharray="2 4" />
      <text x="40" y="250" fontSize="12" fill="#5b6873">Recorded prices</text>
      <text x="290" y="250" fontSize="12" fill="#5b6873">Estimate after 1, 2, 3 years</text>
      <text x="278" y="44" fontSize="11" fill="#5b6873">latest known price</text>
    </svg>
  );
}

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-full">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <span className="font-semibold">Device Price Forecasting</span>
        <nav className="flex gap-2">
          {user ? <Link className="btn btn-primary" to="/dashboard">Open dashboard</Link> : (<><Link className="btn" to="/login">Sign in</Link><Link className="btn btn-primary" to="/register">Create account</Link></>)}
        </nav>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 md:grid-cols-2 md:py-20">
        <div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">What will this laptop or phone cost in three years?</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Pick a device and see its recorded price history, then an estimated price after one, two and three years, with the uncertainty shown.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="btn btn-primary px-5 py-2.5" to={user ? "/predict" : "/register"}>Forecast a device</Link>
            <Link className="btn px-5 py-2.5" to={user ? "/devices" : "/login"}>Browse devices</Link>
          </div>
        </div>
        <div className="card p-3">
          <Schematic />
          <p className="px-2 pb-1 pt-2 text-xs text-muted">Illustration of the layout, not real data.</p>
        </div>
      </section>
      <section className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-3">
          <div><h2 className="font-semibold">Separate models per category</h2><p className="mt-2 text-sm text-muted">Laptops and smartphones depreciate differently, so each has its own pipeline and features. Data is never mixed.</p></div>
          <div><h2 className="font-semibold">Chosen on held-out data</h2><p className="mt-2 text-sm text-muted">Several models compete on the most recent prices, kept out of training. The best one is used and its error is shown.</p></div>
          <div><h2 className="font-semibold">Estimates, not promises</h2><p className="mt-2 text-sm text-muted">Forecasts reflect past price patterns and may differ from actual market prices. Every result says so.</p></div>
        </div>
      </section>
    </div>
  );
}
