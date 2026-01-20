// Local storage deck management for Fantasy Football Card Gen
// Stores decks in localStorage under keys:
// - ffcg.decks: JSON array of LocalDeck
// - ffcg.currentDeckId: string | undefined

import {base64UrlDecode, base64UrlEncode} from "../utils/codec";
import {type FFCGDeckPayload, Deck, FantasyFootballCardSerializable} from "../types";

export interface LocalStorageDeckData {
  id: string;
  name: string;
  data: string; // base64-url of { v: 1, cards }
  updatedAt: number; // epoch ms
}

const DECKS_KEY = 'ffcg.decks';
const CURRENT_ID_KEY = 'ffcg.currentDeckId';

function readDecks(): LocalStorageDeckData[] {
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

function writeDecks(decks: LocalStorageDeckData[]) {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  emitDecksChanged();
}

function isDeck(x: any): x is LocalStorageDeckData {
  return x && typeof x.id === 'string' && typeof x.name === 'string' && typeof x.data === 'string';
}

function genId() {
  return 'deck_' + Math.random().toString(36).slice(2, 8) + '_' + Date.now().toString(36);
}

function listDecksLs(): LocalStorageDeckData[] {
  // Newest first
  return readDecks().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function listDecks(): Deck[] {
    // Newest first
    return listDecksLs().map(lsd=> decodeLsDeck(lsd))
}

function getDeckLs(id: string | undefined | null): LocalStorageDeckData | undefined {
  if (!id) return undefined;
  return readDecks().find(d => d.id === id);
}

function decodeLsDeck(local: LocalStorageDeckData) : Deck {
    const data = base64UrlDecode<{v:number, cards: FantasyFootballCardSerializable[]}>(local.data);
    return {
        id: local.id,
        name: local.name,
        cards: data.cards,
        v: data.v
    };
}

export function getDeck(id: string | undefined | null): Deck | undefined {
    const lsDeck =  getDeckLs(id)
    return decodeLsDeck(lsDeck ?? {id: '', name: '', data: '', updatedAt: 0});
}

export function saveDeck(deck: Deck): Deck {
    const payload: FFCGDeckPayload = {v: 1, cards: deck.cards};
    const d = base64UrlEncode(payload);
    const saved = saveDeckLs({id: deck.id, name: deck.name, data: d});
    return decodeLsDeck(saved);
}

export function saveDeckLs(params: { id?: string | null; name?: string; data: string }): LocalStorageDeckData {
  const decks = readDecks();
  const now = Date.now();

  //overwrite existing
  if (params.id) {
    const idx = decks.findIndex(d => d.id === params.id);
    if (idx >= 0) {
      const updated: LocalStorageDeckData = { ...decks[idx], data: params.data, updatedAt: now, name: params.name ?? decks[idx].name };
      decks[idx] = updated;
      writeDecks(decks);
      return updated;
    }
  }
  //or create new
  const name = params.name || nextUntitledName(decks);
  const deck: LocalStorageDeckData = { id: genId(), name, data: params.data, updatedAt: now };
  decks.push(deck);
  writeDecks(decks);
  return deck;
}

export function renameDeck(id: string, newName: string): LocalStorageDeckData | undefined {
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
  return true;
}

export function nextUntitledName(existing?: LocalStorageDeckData[] | null): string {
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
