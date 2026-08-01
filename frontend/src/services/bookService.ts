import { bookApi } from "../api/bookApi";
export const bookService = {
  search: (query: string) => bookApi.list({ q: query }),
  getCopies: (query: string) => bookApi.copies({ q: query }),
  save: (data: any, id?: number) =>
    id ? bookApi.update(id, data) : bookApi.create(data),
};
