import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type User } from "./api";

interface Ctx { user: User | null; loading: boolean; setUser: (u: User | null) => void; logout: () => Promise<void> }
const AuthCtx = createContext<Ctx>(null as unknown as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
    const expired = () => setUser(null);
    window.addEventListener("auth:expired", expired);
    return () => window.removeEventListener("auth:expired", expired);
  }, []);
  const logout = useCallback(async () => { try { await api.logout(); } finally { setUser(null); } }, []);
  return <AuthCtx.Provider value={{ user, loading, setUser, logout }}>{children}</AuthCtx.Provider>;
}
