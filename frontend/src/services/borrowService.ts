import { borrowApi } from "../api/borrowApi";
export const borrowService = {
  list: () => borrowApi.list(),
  checkout: (data: { user_id: number; copy_ids: number[]; due_date: string }) =>
    borrowApi.create(data),
  returnLoan: (id: number) => borrowApi.returnLoan(id),
};
