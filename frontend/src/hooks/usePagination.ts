import { useMemo, useState } from "react";
export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );
  return {
    page,
    pages,
    current,
    next: () => setPage((value) => Math.min(pages, value + 1)),
    previous: () => setPage((value) => Math.max(1, value - 1)),
    setPage,
  };
}
