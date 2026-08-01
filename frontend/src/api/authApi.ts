import { api } from "./axios";
import type { User } from "../types/user";
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ user: User }>("/auth/login", { username, password }),
  register: (data: {
    username: string;
    password: string;
    full_name: string;
    user_type: "student" | "teacher";
    class_name?: string;
    department?: string;
    email?: string;
    phone?: string;
  }) => api.post<{ user: User }>("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get<{ user: User | null }>("/auth/me"),
};
