export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function parsePagination(searchParams, {
  enabledByDefault = false,
  defaultLimit = DEFAULT_PAGE_SIZE,
} = {}) {
  const requested = enabledByDefault || searchParams.has('page') || searchParams.has('limit');
  if (!requested) return null;

  const rawPage = searchParams.get('page') ?? '1';
  const rawLimit = searchParams.get('limit') ?? String(defaultLimit);
  const page = Number(rawPage);
  const limit = Number(rawLimit);

  if (!Number.isSafeInteger(page) || page < 1) {
    return { error: 'page must be a positive integer' };
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    return { error: `limit must be an integer between 1 and ${MAX_PAGE_SIZE}` };
  }

  const skip = (page - 1) * limit;
  if (!Number.isSafeInteger(skip)) return { error: 'page is too large' };

  return { page, limit, skip };
}

export function paginationMeta(total, { page, limit }) {
  return { total, page, limit, pages: Math.ceil(total / limit) };
}
