export interface Book {
  id: number;
  title: string;
  author?: string;
  publisher?: string;
  publish_year?: number;
  category?: string;
  description?: string;
  page_count?: number;
  cover_image?: string;
  total_quantity: number;
  available_quantity: number;
  status?: "active" | "archived";
  borrowed_quantity?: number;
}
export interface BookCopy {
  id: number;
  book_id: number;
  inventory_code: string;
  title: string;
  status: string;
  shelf?: string;
  holder_name?: string;
  due_date?: string;
}
export interface AdminBookDetail extends Book {
  borrowed_quantity: number;
  copies: BookCopy[];
  history: Array<{
    loan_code: string;
    full_name: string;
    username: string;
    inventory_code: string;
    borrow_date: string;
    due_date: string;
    returned_at?: string;
    disposition: string;
  }>;
}
export interface CopyDetail extends BookCopy {
  author?: string;
  publisher?: string;
  history: Array<{
    loan_code: string;
    full_name: string;
    username: string;
    borrow_date: string;
    due_date: string;
    returned_at?: string;
    disposition: string;
    condition_out?: string;
    condition_in?: string;
    notes?: string;
  }>;
}
