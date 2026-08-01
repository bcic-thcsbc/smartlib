export interface LoanItem {
  item_id: number;
  book_copy_id: number;
  inventory_code: string;
  title: string;
  author?: string;
  disposition: "borrowed" | "returned" | "lost" | "damaged";
  condition_out?: string;
  condition_in?: string;
  returned_at?: string;
  notes?: string;
}
export interface Loan {
  id: number;
  user_id: number;
  full_name: string;
  username?: string;
  user_type?: "student" | "teacher";
  class_name?: string;
  department?: string;
  loan_code?: string;
  books: string;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  status: string;
  items: LoanItem[];
  returned_count: number;
  renew_count?: number;
}
export interface BorrowRequest {
  id: number;
  user_id: number;
  book_id: number;
  title: string;
  full_name?: string;
  inventory_code?: string;
  status: string;
  requested_at: string;
  desired_start_date?: string;
  planned_due_date?: string;
  pickup_deadline?: string;
  reservation_status?: string;
  hold_deadline?: string;
  reason?: string;
  notes?: string;
}
export interface Page<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
