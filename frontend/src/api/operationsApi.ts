import { api } from "./axios";
export interface Policy {
  user_type: "student" | "teacher";
  max_active_loans: number;
  loan_days: number;
  max_renewals: number;
  renewal_days: number;
  pickup_hours: number;
}
export interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  read_at?: string;
  created_at: string;
}
export const operationsApi = {
  policies: () => api.get<Policy[]>("/settings/circulation"),
  updatePolicies: (data: Policy[]) =>
    api.put<Policy[]>("/settings/circulation", data),
  notifications: () =>
    api.get<{ data: Notification[]; unread: number }>("/notifications"),
  readNotification: (id: number) => api.post(`/notifications/${id}/read`),
  readAllNotifications: () => api.post("/notifications/read-all"),
  report: (params?: Record<string, string>) =>
    api.get("/reports/circulation", { params }),
  incidents: (status?: string) => api.get("/incidents", { params: { status } }),
  resolveIncident: (
    id: number,
    data: {
      status: "resolved" | "waived";
      amount?: number;
      description?: string;
    },
  ) => api.post(`/incidents/${id}/resolve`, data),
  search: (q: string) => api.get("/search", { params: { q } }),
  schoolSettings: () =>
    api.get<{
      school_name: string;
      timezone: string;
      contact_email?: string;
      inventory_code_prefix: string;
    }>("/settings/school"),
  updateSchoolSettings: (data: { inventory_code_prefix: string }) =>
    api.put("/settings/school", data),
  downloadTemplate: () =>
    api.get("/spreadsheets/books/template", { responseType: "blob" }),
  validateSpreadsheet: (file: File) => {
    const data = new FormData();
    data.append("file", file);
    return api.post("/spreadsheets/books/validate", data);
  },
  importSpreadsheet: (file: File) => {
    const data = new FormData();
    data.append("file", file);
    return api.post("/spreadsheets/books/commit", data);
  },
  exportSpreadsheet: (_unused?: string) =>
    api.get("/spreadsheets/reports/export", { responseType: "blob" }),
};
