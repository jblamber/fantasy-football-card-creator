// Local image storage service
// Stores images (as data URLs) in localStorage under key 'ffcg.images'
// Exposes simple CRUD and a helper to resolve the custom URL scheme 'localimg:<id>'

export interface LocalImageMeta {
  id: string;
  name?: string;
  type?: string; // mime
  size?: number; // bytes (approx from blob)
  createdAt: number;
  dataUrl: string; // data:image/...;base64,...
}

const STORAGE_KEY = 'ffcg.images';

function loadAll(): LocalImageMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as LocalImageMeta[];
  } catch {
    return [];
  }
}

function saveAll(images: LocalImageMeta[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
    window.dispatchEvent(new Event('ffcg:images-changed'));
  } catch {
    // ignore quota or JSON errors
  }
}

export function listImages(): LocalImageMeta[] {
  return loadAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function getImage(id: string): LocalImageMeta | undefined {
  return loadAll().find(i => i.id === id);
}

export function getImageDataUrl(id: string): string | null {
  return getImage(id)?.dataUrl || null;
}

export async function saveImageFile(file: File): Promise<LocalImageMeta> {
  const dataUrl = await fileToDataUrl(file);
  const img: LocalImageMeta = {
    id: genId(),
    name: file.name,
    type: file.type,
    size: file.size,
    createdAt: Date.now(),
    dataUrl,
  };
  const all = loadAll();
  all.push(img);
  saveAll(all);
  return img;
}

export function saveImageDataUrl(dataUrl: string, name?: string): LocalImageMeta {
  const img: LocalImageMeta = {
    id: genId(),
    name,
    type: guessMimeFromDataUrl(dataUrl) || undefined,
    size: approximateSizeFromDataUrl(dataUrl),
    createdAt: Date.now(),
    dataUrl,
  };
  const all = loadAll();
  all.push(img);
  saveAll(all);
  return img;
}

export function deleteImage(id: string): boolean {
  const all = loadAll();
  const next = all.filter(i => i.id !== id);
  if (next.length === all.length) return false;
  saveAll(next);
  return true;
}

export function isLocalImageUrl(url: string | undefined | null): url is string {
  return !!url && url.startsWith('localimg:');
}

export function localImageUrl(id: string): string {
  return `localimg:${id}`;
}

export function parseLocalImageId(url: string): string | null {
  if (!isLocalImageUrl(url)) return null;
  return url.slice('localimg:'.length) || null;
}

function genId(): string {
  // Simple timestamp-random id
  return Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function guessMimeFromDataUrl(dataUrl: string): string | null {
  const m = /^data:([^;]+);/.exec(dataUrl);
  return m ? m[1] : null;
}

function approximateSizeFromDataUrl(dataUrl: string): number {
  // Rough estimate: strip prefix and compute base64 length
  const idx = dataUrl.indexOf('base64,');
  if (idx === -1) return dataUrl.length;
  const b64 = dataUrl.slice(idx + 7);
  // 4 base64 chars ~ 3 bytes
  return Math.floor((b64.length * 3) / 4);
}
