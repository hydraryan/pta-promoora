import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, getToken, setToken } from "./api";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  role: "candidate" | "admin";
  must_change_password: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const { user } = await apiFetch<{ user: AuthUser }>("/api/auth/me");
      setUser(user);
    } catch {
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await apiFetch<{ token: string; user: AuthUser }>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    setToken(token);
    setUser(user);
    return user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
