import { api } from "./axios";
import type {
  AdminBookDetail,
  Book,
  BookCopy,
  CopyDetail,
} from "../types/book";
export interface Page<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
export const bookApi = {
  list: (params: Record<string, string | number> = {}) =>
    api.get<Page<Book>>("/books", { params }),
  detail: (id: number) => api.get<Book>(`/books/${id}`),
  availability: (id: number, start_date: string, desired_due_date: string) =>
    api.get<{
      available: boolean;
      available_copy_count: number;
      next_available_date: string | null;
      start_date: string;
      desired_due_date: string;
      max_due_date: string;
    }>(`/books/${id}/availability`, {
      params: { start_date, desired_due_date },
    }),
  adminDetail: (id: number) =>
    api.get<AdminBookDetail>(`/books/${id}/admin-detail`),
  create: (data: Partial<Book> & { quantity?: number; shelf?: string }) =>
    api.post<Book>("/books", data),
  update: (id: number, data: Partial<Book>) =>
    api.put<Book>(`/books/${id}`, data),
  remove: (id: number) => api.delete(`/books/${id}`),
  removeMany: (ids: number[]) => api.delete("/books", { data: { ids } }),
  copies: (params: Record<string, string | number> = {}) =>
    api.get<Page<BookCopy>>("/book-copies", { params }),
  copyDetail: (id: number) => api.get<CopyDetail>(`/book-copies/${id}`),
  createCopies: (data: { book_id: number; quantity: number; shelf?: string }) =>
    api.post("/book-copies", data),
  updateCopy: (id: number, data: Partial<BookCopy>) =>
    api.put<BookCopy>(`/book-copies/${id}`, data),
  removeCopy: (id: number) => api.delete(`/book-copies/${id}`),
  removeCopies: (ids: number[]) =>
    api.delete("/book-copies", { data: { ids } }),
  uploadCover: (file: File) => {
    const data = new FormData();
    data.append("file", file);
    return api.post<{ url: string }>("/uploads/covers", data);
  },
};
