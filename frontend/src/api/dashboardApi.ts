import { api } from "./axios";
import type { DashboardData } from "../types/api";
export const dashboardApi = {
  summary: () => api.get<DashboardData>("/dashboard"),
};
