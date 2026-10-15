import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Icon } from "./Icon";

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-semibold" aria-label="Device Price Forecasting - home">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white shadow-sm"><Icon name="ChartLine" className="h-5 w-5" /></span>
      <span className={`leading-tight ${light ? "text-white" : "text-ink"}`}>Device Price<span className="block text-xs font-medium text-muted">Forecasting</span></span>
    </Link>
  );
}

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-ink"}`;

export default function SiteNav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);        // mobile menu
  const [menu, setMenu] = useState(false);        // profile menu
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { setOpen(false); setMenu(false); }, [loc.pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && (setMenu(false), setOpen(false));
    document.addEventListener("mousedown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);
  const signOut = async () => { await logout(); nav("/"); };

  const links = (
    <>
      <NavLink to="/" end className={linkCls}>Home</NavLink>
      <NavLink to="/smartphones" className={linkCls}>Smartphones</NavLink>
      <NavLink to="/laptops" className={linkCls}>Laptops</NavLink>
      <NavLink to="/compare" className={linkCls}>Compare</NavLink>
      <NavLink to="/predict" className={linkCls}>Price Forecast</NavLink>
      <NavLink to="/about" className={linkCls}>About</NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 md:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">{links}</nav>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative" ref={box}>
              <button className="btn !rounded-full !py-1.5 pl-1.5" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">{(user.full_name || user.email).slice(0, 1).toUpperCase()}</span>
                <span className="hidden max-w-[10rem] truncate sm:inline">{user.full_name}</span>
                <Icon name="ChevronRight" className={`h-4 w-4 transition ${menu ? "rotate-90" : ""}`} />
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 mt-2 w-64 rounded-2xl border border-line bg-white p-2 shadow-lift">
                  <div className="px-3 py-2 text-xs text-muted"><div className="font-medium text-ink">{user.full_name}</div>{user.email}</div>
                  <MenuLink to="/dashboard" icon="LayoutDashboard">Dashboard</MenuLink>
                  <MenuLink to="/predictions" icon="History">My forecasts</MenuLink>
                  {user.role === "admin" && (
                    <>
                      <div className="px-3 pt-2 pb-1 text-xs font-semibold text-muted">Administration</div>
                      <MenuLink to="/admin" icon="Settings">Overview &amp; devices</MenuLink>
                      <MenuLink to="/admin/datasets" icon="Database">Datasets</MenuLink>
                      <MenuLink to="/admin/models" icon="Cpu">Models &amp; logs</MenuLink>
                    </>
                  )}
                  <button role="menuitem" className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50" onClick={signOut}>
                    <Icon name="LogOut" className="h-4 w-4" />Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link className="btn hidden sm:inline-flex" to="/login">Sign in</Link>
              <Link className="btn btn-primary" to="/register">Create account</Link>
            </>
          )}
          <button className="btn !px-2.5 lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            <Icon name={open ? "X" : "Menu"} className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="grid gap-1 border-t border-line bg-white px-4 py-3 lg:hidden">
          {links}
          {user && <NavLink to="/dashboard" className={linkCls}>Dashboard</NavLink>}
          {!user && <NavLink to="/login" className={linkCls}>Sign in</NavLink>}
        </nav>
      )}
    </header>
  );
}

function MenuLink({ to, icon, children }: { to: string; icon: Parameters<typeof Icon>[0]["name"]; children: React.ReactNode }) {
  return (
    <Link role="menuitem" to={to} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-100">
      <Icon name={icon} className="h-4 w-4 text-slate-500" />{children}
    </Link>
  );
}
