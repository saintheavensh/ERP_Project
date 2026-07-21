// H13 — server-side loaders that need a FULL list (POS product grid, the
// inventory catalog page, the opname/purchasing item pickers) now walk every
// page of a cursor-paginated endpoint instead of relying on an unbounded
// single request. Keeps today's "give me the whole catalog" SSR behavior
// while the backend enforces a bounded page size per request.
export async function fetchAllPages<T>(
  url: string,
  token: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;

  for (;;) {
    const qs = new URLSearchParams({ ...params, limit: '200', ...(cursor ? { cursor } : {}) });
    const res = await fetch(`${url}?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) break;

    const json = await res.json();
    all.push(...(json.data ?? []));

    if (json.meta?.has_more && json.meta?.next_cursor) {
      cursor = json.meta.next_cursor;
    } else {
      break;
    }
  }

  return all;
}
