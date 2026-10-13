import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const link = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm ${isActive ? "bg-accent text-white" : "text-ink hover:bg-paper"}`;

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-full md:flex">
      <aside className="border-b border-line bg-white md:min-h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-3 md:block">
          <div className="text-base font-semibold leading-tight">Device Price<br className="hidden md:block" /> Forecasting</div>
          <button className="btn md:mt-4 md:w-full" onClick={async () => { await logout(); nav("/"); }}>Sign out</button>
        </div>
        <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:overflow-visible">
          <NavLink to="/dashboard" className={link}>Dashboard</NavLink>
          <NavLink to="/devices" className={link}>Devices</NavLink>
          <NavLink to="/predict" className={link}>New forecast</NavLink>
          <NavLink to="/predictions" className={link}>My forecasts</NavLink>
          {user?.role === "admin" && (
            <>
              <div className="hidden px-3 pt-4 pb-1 text-xs font-semibold text-muted md:block">Administration</div>
              <NavLink to="/admin" end className={link}>Overview &amp; devices</NavLink>
              <NavLink to="/admin/datasets" className={link}>Datasets</NavLink>
              <NavLink to="/admin/models" className={link}>Models &amp; logs</NavLink>
            </>
          )}
        </nav>
        <div className="hidden px-4 py-3 text-xs text-muted md:block">{user?.full_name}<br />{user?.email}</div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8"><div className="mx-auto max-w-6xl"><Outlet /></div></main>
    </div>
  );
}
