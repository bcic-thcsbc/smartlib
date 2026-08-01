import { createContext, useEffect, useState } from "react";
import { authApi } from "../api/authApi";
import type { User } from "../types/user";
interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (data: {
    username: string;
    password: string;
    full_name: string;
    user_type: "student" | "teacher";
    class_name?: string;
    department?: string;
    email?: string;
    phone?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthValue | undefined>(undefined);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    authApi
      .me()
      .then((r) => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  const login = async (username: string, password: string) => {
    const result = await authApi.login(username, password);
    setUser(result.data.user);
    return result.data.user;
  };
  const register = async (data: Parameters<typeof authApi.register>[0]) => {
    const result = await authApi.register(data);
    setUser(result.data.user);
    return result.data.user;
  };
  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export { AuthContext };
