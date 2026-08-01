import { api } from "./axios";
import type { User } from "../types/user";
export interface UserPage {
  data: User[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
export const userApi = {
  list: (params: Record<string, string | number> = {}) =>
    api.get<UserPage>("/users", { params }),
  update: (id: number, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),
  remove: (id: number) => api.delete(`/users/${id}`),
  profile: () => api.get<User>("/profile"),
  updateProfile: (data: Partial<User>) => api.put("/profile", data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.put("/profile/password", data),
};
