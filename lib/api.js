export const API_BASE = 'https://www.a2asearch.ai/api/v1';
export const REQUEST_TIMEOUT_MS = 15_000;

export async function fetchJson(path, { signal, timeoutMs = REQUEST_TIMEOUT_MS, fetchImpl = fetch } = {}) {
  const timeout = AbortSignal.timeout(timeoutMs);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const res = await fetchImpl(`${API_BASE}/${path}`, { signal: requestSignal });
    if (!res.ok) {
      const retry = res.status === 429 ? res.headers.get('retry-after') : null;
      await res.body?.cancel();
      const error = new Error(`API error: HTTP ${res.status}${retry ? ` (retry after ${retry} seconds)` : ''}`);
      error.status = res.status;
      throw error;
    }
    return await res.json();
  } catch (error) {
    if (timeout.aborted) throw new Error(`API request timed out after ${timeoutMs / 1000} seconds`);
    throw error;
  }
}
