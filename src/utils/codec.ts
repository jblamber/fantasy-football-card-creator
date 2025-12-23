// Base64 URL-safe encode/decode for JSON payloads
export function base64UrlEncode(obj: unknown): string {
    const json = JSON.stringify(obj);
    const b64 = typeof window === 'undefined'
        ? Buffer.from(json, 'utf8').toString('base64')
        : btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64UrlDecode<T = unknown>(b64url: string): T {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 2 ? '==' : b64.length % 4 === 3 ? '=' : '';
    const str = typeof window === 'undefined'
        ? Buffer.from(b64 + pad, 'base64').toString('utf8')
        : decodeURIComponent(escape(atob(b64 + pad)));
    return JSON.parse(str) as T;
}