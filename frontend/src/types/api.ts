import type { Loan } from "./borrow";
export interface DashboardStats {
  bookTitles: number;
  totalCopies: number;
  borrowedCopies: number;
  availableCopies: number;
  reservedCopies?: number;
  students: number;
  teachers: number;
  pendingRequests?: number;
  overdueLoans?: number;
  openIncidents?: number;
}
export interface DashboardData {
  stats: DashboardStats;
  recent: Array<Loan & { titles: string }>;
}
