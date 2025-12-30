// Local storage deck management for Fantasy Football Card Gen
// Stores decks in localStorage under keys:
// - ffcg.decks: JSON array of LocalDeck
// - ffcg.currentDeckId: string | undefined

export interface LocalDeck {
  id: string;
  name: string;
  data: string; // base64-url of { v: 1, cards }
  updatedAt: number; // epoch ms
}

const DECKS_KEY = 'ffcg.decks';
const CURRENT_ID_KEY = 'ffcg.currentDeckId';

function readDecks(): LocalDeck[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter(isDeck);
    return [];
  } catch {
    return [];
  }
}

function emitDecksChanged() {
  // notify same-tab listeners
  window.dispatchEvent(new CustomEvent('ffcg:decks-changed'));
}

function writeDecks(decks: LocalDeck[]) {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  emitDecksChanged();
}

function isDeck(x: any): x is LocalDeck {
  return x && typeof x.id === 'string' && typeof x.name === 'string' && typeof x.data === 'string';
}

function genId() {
  return 'deck_' + Math.random().toString(36).slice(2, 8) + '_' + Date.now().toString(36);
}

export function listDecks(): LocalDeck[] {
  // Newest first
  return readDecks().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getDeck(id: string | undefined | null): LocalDeck | undefined {
  if (!id) return undefined;
  return readDecks().find(d => d.id === id);
}

export function saveDeck(params: { id?: string | null; name?: string; data: string }): LocalDeck {
  const decks = readDecks();
  const now = Date.now();
  if (params.id) {
    const idx = decks.findIndex(d => d.id === params.id);
    if (idx >= 0) {
      const updated: LocalDeck = { ...decks[idx], data: params.data, updatedAt: now, name: params.name ?? decks[idx].name };
      decks[idx] = updated;
      writeDecks(decks);
      return updated;
    }
  }
  // create new
  const name = params.name || nextUntitledName(decks);
  const deck: LocalDeck = { id: genId(), name, data: params.data, updatedAt: now };
  decks.push(deck);
  writeDecks(decks);
  return deck;
}

export function renameDeck(id: string, newName: string): LocalDeck | undefined {
  const name = newName.trim();
  if (!name) return undefined;
  const decks = readDecks();
  const idx = decks.findIndex(d => d.id === id);
  if (idx < 0) return undefined;
  decks[idx] = { ...decks[idx], name, updatedAt: Date.now() };
  writeDecks(decks);
  return decks[idx];
}

export function deleteDeck(id: string): boolean {
  const decks = readDecks();
  const next = decks.filter(d => d.id !== id);
  if (next.length === decks.length) return false;
  writeDecks(next);
  const current = getCurrentDeckId();
  if (current === id) localStorage.removeItem(CURRENT_ID_KEY);
  return true;
}

export function getCurrentDeckId(): string | null {
  return localStorage.getItem(CURRENT_ID_KEY);
}

export function setCurrentDeckId(id: string | null | undefined) {
  if (!id) localStorage.removeItem(CURRENT_ID_KEY);
  else localStorage.setItem(CURRENT_ID_KEY, id);
  emitDecksChanged();
}

export function nextUntitledName(existing?: LocalDeck[] | null): string {
  const decks = existing ?? readDecks();
  const base = 'Untitled';
  const names = new Set(decks.map(d => d.name));
  if (!names.has(base)) return base;
  for (let i = 2; i < 999; i++) {
    const n = `${base} (${i})`;
    if (!names.has(n)) return n;
  }
  // fallback with id suffix
  return `${base} ${genId().slice(-4)}`;
}
