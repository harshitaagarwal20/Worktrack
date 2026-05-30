export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? 1), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 10), 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
