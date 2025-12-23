import {BACKEND_BASE_URL} from '../config';

export async function saveSet(dataB64Url: string): Promise<{ code: string }> {
    if (!BACKEND_BASE_URL) throw new Error('Backend not configured');
    const hash = await sha256Hex(dataB64Url);
    const res = await fetch(`${BACKEND_BASE_URL}/save`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({hash, data: dataB64Url})
    });
    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    return res.json();
}

export async function loadSet(code: string): Promise<{ data: string }> {
    if (!BACKEND_BASE_URL) throw new Error('Backend not configured');
    const res = await fetch(`${BACKEND_BASE_URL}/get/${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error(`Load failed: ${res.status}`);
    return res.json();
}

async function sha256Hex(input: string): Promise<string> {
    const enc = new TextEncoder();
    const data = enc.encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}