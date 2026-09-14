export type ParentPostQuery = { search: string; categoryId: string | null; page: number };

type QueryParams = Pick<URLSearchParams, 'get'>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parentPostQuery(params: QueryParams): ParentPostQuery {
  const page = Number(params.get('page'));
  const categoryId = params.get('categoryId');
  return {
    search: params.get('search')?.trim() ?? '',
    categoryId: categoryId && UUID.test(categoryId) ? categoryId : null,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function parentPostQueryParams(query: ParentPostQuery) {
  return {
    ...(query.search ? { search: query.search } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.page > 1 ? { page: String(query.page) } : {}),
  };
}

export function withParentPostFilters(query: ParentPostQuery, search: string, categoryId: string | null): ParentPostQuery {
  return { ...query, search: search.trim(), categoryId, page: 1 };
}

export function withParentPostPage(query: ParentPostQuery, page: number): ParentPostQuery {
  return { ...query, page: Number.isSafeInteger(page) && page > 0 ? page : 1 };
}
