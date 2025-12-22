// Backend configuration (optional). Leave empty to disable backend features.
export const BACKEND_BASE_URL = '';

// Expected endpoints when enabled:
// POST `${BACKEND_BASE_URL}/save` with body { hash: string, data: string } -> { code: string }
// GET `${BACKEND_BASE_URL}/get/${code}` -> { data: string }
