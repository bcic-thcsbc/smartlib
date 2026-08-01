import { api } from "./axios";
import type { BorrowRequest, Loan, Page } from "../types/borrow";
export const borrowApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<Page<Loan>>("/borrow", { params }),
  detail: (id: number) => api.get<Loan>(`/borrow/${id}`),
  create: (data: { user_id?: number; copy_ids: number[]; due_date: string; visitor?: { full_name: string; gender: "male" | "female"; class_name: string; email: string; phone: string } }) =>
    api.post("/borrow", data),
  returnLoan: (id: number) => api.post(`/borrow/${id}/return`),
  returnItem: (loanId: number, itemId: number, data?: Record<string, string>) =>
    api.post(`/borrow/${loanId}/items/${itemId}/return`, data),
  markLost: (
    loanId: number,
    itemId: number,
    data?: Record<string, string | number>,
  ) => api.post(`/borrow/${loanId}/items/${itemId}/mark-lost`, data),
  markDamaged: (
    loanId: number,
    itemId: number,
    data?: Record<string, string | number>,
  ) => api.post(`/borrow/${loanId}/items/${itemId}/mark-damaged`, data),
  renew: (id: number) => api.post(`/borrow/${id}/renew`),
  requests: (params?: Record<string, string | number>) =>
    api.get<Page<BorrowRequest>>("/borrow-requests", { params }),
  createRequest: (
    book_id: number,
    desired_start_date: string,
    desired_due_date: string,
    notes?: string,
  ) =>
    api.post<BorrowRequest>("/borrow-requests", {
      book_id,
      desired_start_date,
      desired_due_date,
      notes,
    }),
  approveRequest: (id: number) => api.post(`/borrow-requests/${id}/approve`),
  rejectRequest: (id: number, reason?: string) =>
    api.post(`/borrow-requests/${id}/reject`, { reason }),
  cancelRequest: (id: number) => api.post(`/borrow-requests/${id}/cancel`),
  checkoutRequest: (id: number, due_date?: string) =>
    api.post(`/borrow-requests/${id}/checkout`, { due_date }),
};
