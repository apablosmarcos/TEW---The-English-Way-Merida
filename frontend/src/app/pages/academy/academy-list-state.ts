export type ParentPostQuery = { search: string; categoryId: string | null; page: number };
export type AdminUserQuery = { search: string; role: 'parent' | 'admin' | null; state: 'active' | 'disabled' | 'deleted' | null; page: number };

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

export function adminUserQuery(params: QueryParams): AdminUserQuery {
  const role = params.get('role');
  const state = params.get('state');
  const page = Number(params.get('page'));
  return {
    search: params.get('search')?.trim() ?? '',
    role: role === 'parent' || role === 'admin' ? role : null,
    state: state === 'active' || state === 'disabled' || state === 'deleted' ? state : null,
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function adminUserQueryParams(query: AdminUserQuery) {
  return {
    ...(query.search ? { search: query.search } : {}),
    ...(query.role ? { role: query.role } : {}),
    ...(query.state ? { state: query.state } : {}),
    ...(query.page > 1 ? { page: String(query.page) } : {}),
  };
}

export function withAdminUserFilters(query: AdminUserQuery, search: string, role: AdminUserQuery['role'], state: AdminUserQuery['state']): AdminUserQuery {
  return { ...query, search: search.trim(), role, state, page: 1 };
}

export function withAdminUserPage(query: AdminUserQuery, page: number): AdminUserQuery {
  return { ...query, page: Number.isSafeInteger(page) && page > 0 ? page : 1 };
}
