import React, { useMemo, useCallback, useEffect, useState } from "react";
import FantasyFootballCard, { CardRarity, PlayerType } from "./bloodbowl/FantasyFootballCard";
import { AnyPayload, CardSerializable } from "./types";
import { base64UrlDecode } from "./utils/codec";
import { loadSet, saveSet } from './services/backend';
import { isSignedIn, signIn, signOut } from './services/auth';

function useHashRoute() {
  const [hash, setHash] = useState<string>(window.location.hash || '#/viewer');
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || '#/viewer');
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) window.location.hash = '#/viewer';
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return hash;
}

function parseQuery(search: string) {
  const params = new URLSearchParams(search);
  return Object.fromEntries(params.entries());
}

function mapToRuntime(card: CardSerializable) {
  return {
    ...card,
    imagery: {
      imageProperties: card.imagery.imageProperties,
      lenticularImages: new Map(card.imagery.lenticularUrls.map((u, i) => [String(i), u]))
    }
  };
}

function DefaultViewer() {
  const grailKnightA = useMemo(() => ({
    rarity: "rare rainbow alt" as CardRarity,
    playerData: {
      ma: "7", st: "3", ag: "3+", av: "10+", pa: "4+",
      cardName: "Sir Grail 1",
      skillsAndTraits: "Block, Dauntless, Steady Footing",
      positionName: "Blitzer", primary: "G,S", secondary: "A",
      footer: "Games Plus Spring 2026 League",
      playerType: "normal" as PlayerType, teamName: "Bruisers of Brione", cost: "95,000"
    },
    imagery: { imageProperties: { offsetX: -60, offsetY: 0, scalePercent: 150 }, lenticularImages: new Map<string, string>([["0", "/img/players/grail1.png"]]) },
    types: "fire"
  }), []);

  const grailKnightB = useMemo(() => ({
    rarity: "rare rainbow" as CardRarity,
    playerData: {
      ma: "7", st: "3", ag: "3+", av: "10+", pa: "4+",
      cardName: "Sir Grail 2",
      skillsAndTraits: "Block, Dauntless, Steady Footing",
      positionName: "Blitzer", primary: "G,S", secondary: "A",
      footer: "Games Plus Spring 2026 League",
      playerType: "normal" as PlayerType, teamName: "Bruisers of Brione", cost: "95,000"
    },
    imagery: { imageProperties: { offsetX: -50, offsetY: 0, scalePercent: 150 }, lenticularImages: new Map<string, string>([["0", "/img/players/grail2.png"]]) },
    types: "electric"
  }), []);

  const thrower1 = useMemo(() => ({
    rarity: "rare shiny v" as CardRarity,
    playerData: {
      ma: "6", st: "3", ag: "3+", av: "9+", pa: "3+",
      cardName: "Sir Thrower",
      skillsAndTraits: "Dauntless, Nerves of Steel, Pass",
      positionName: "Thrower", primary: "G,P", secondary: "A,S",
      footer: "Games Plus Spring 2026 League",
      playerType: "normal" as PlayerType, teamName: "Bruisers of Brione", cost: "80,000"
    },
    imagery: { imageProperties: { offsetX: 0, offsetY: 0, scalePercent: 150 }, lenticularImages: new Map<string, string>([["0", "/img/players/thrower1.png"]]) },
    types: "water"
  }), []);

  return <CardsViewport cards={[grailKnightA, grailKnightB, thrower1]} />
}

function CardsViewport({ cards }: { cards: any[] }) {
  const [index, setIndex] = useState(0);
  const next = useCallback(() => setIndex(i => (i + 1) % cards.length), [cards.length]);
  const prev = useCallback(() => setIndex(i => (i - 1 + cards.length) % cards.length), [cards.length]);
  const onViewportClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) prev(); else next();
  }, [next, prev]);

  return (
    <section className="card-viewport" onClick={onViewportClick} style={{ width: '100vw', height: '100vh', display: 'flex', padding: '0.3rem', justifyContent: 'center', background: '#111', touchAction: 'manipulation' }}>
      <div onClick={(e)=> e.stopPropagation()} style={{ width: 'min(90vw, calc(90vh * 822 / 1122))', aspectRatio: '822 / 1122' }}>
        <FantasyFootballCard
          {...cards[index]}
          onSwipe={(dir) => { if (dir === 'left') next(); else prev(); }}
        />
      </div>
    </section>
  );
}

function CardViewer() {
  const hash = useHashRoute();
  const [, routeAndQuery] = hash.split('#');
  const [route, queryString] = (routeAndQuery || '/viewer').split('?');
  const q = parseQuery(queryString || '');

  // support ?d= for base64 data immediately
  if (q.d) {
    try {
      const payload = base64UrlDecode<AnyPayload>(q.d);
      if (payload && (payload as any).v === 1) {
        const cards = (payload as AnyPayload).cards.map(mapToRuntime);
        return <CardsViewport cards={cards} />
      }
    } catch (e) {
      // fallthrough to backend or default
    }
  }

  // support ?s= shortcode via backend
  const [loaded, setLoaded] = useState<{ ok: boolean; cards?: any[] } | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!q.s) { setLoaded({ ok: false }); return; }
      try {
        const { data } = await loadSet(q.s);
        const payload = base64UrlDecode<AnyPayload>(data);
        if (!cancelled && payload && (payload as any).v === 1) {
          setLoaded({ ok: true, cards: (payload as AnyPayload).cards.map(mapToRuntime) });
        }
      } catch (err) {
        if (!cancelled) setLoaded({ ok: false });
      }
    }
    run();
    return () => { cancelled = true; };
  }, [q.s]);

  if (q.s) {
    if (!loaded) return <div style={{ color: '#fff', padding: 16 }}>Loading…</div>;
    if (loaded.ok && loaded.cards) return <CardsViewport cards={loaded.cards} />;
  }

  return <DefaultViewer />
}

export default function App() {
  const hash = useHashRoute();
  const [, routeAndQuery] = hash.split('#');
  const [route] = (routeAndQuery || '/viewer').split('?');

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{ position: 'fixed', top: 8, left: 8, zIndex: 10, display: 'flex', gap: 8 }}>
        <a href="#/viewer" style={{ color: '#fff', textDecoration: 'none', padding: '6px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: 6 }}>Viewer</a>
        <a href="#/create" style={{ color: '#fff', textDecoration: 'none', padding: '6px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: 6 }}>Creator</a>
      </nav>
        <div style={{ paddingTop: '36px', maxWidth: 900, margin: '0 auto' }}>
      {route === '/create' ? <CardCreator /> : <CardViewer />}
        </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, color: '#ddd' }}>{label}</span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...props.style, padding: '8px 10px', borderRadius: 6, border: '1px solid #444', background: '#1a1a1a', color: '#fff' }} />
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...props.style, padding: '8px 10px', borderRadius: 6, border: '1px solid #444', background: '#1a1a1a', color: '#fff' }} />
}

import { base64UrlEncode } from './utils/codec';
import type { CardSetPayloadV1, PlayerData } from './types';

function CardCreator() {
  const emptyPlayer: PlayerData = {
    ag: '', av: '', ma: '', pa: '', st: '', playerType: 'normal', teamName: '', cost: '', cardName: '', skillsAndTraits: '', positionName: '', primary: '', secondary: '', footer: ''
  };
  const [cards, setCards] = useState<CardSerializable[]>([{
    rarity: 'common', playerData: emptyPlayer, imagery: { imageProperties: { offsetX: 0, offsetY: 0, scalePercent: 100 }, lenticularUrls: ['/img/players/grail1.png'] }
  }]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [signedInState, setSignedInState] = useState<boolean>(isSignedIn());

  const addCard = useCallback(() => {
    setCards(prev => [...prev, { rarity: 'common', playerData: { ...emptyPlayer }, imagery: { imageProperties: { offsetX: 0, offsetY: 0, scalePercent: 100 }, lenticularUrls: [] } }]);
  }, []);

  const updateCard = useCallback((idx: number, patch: Partial<CardSerializable>) => {
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, ...patch, playerData: { ...c.playerData, ...(patch as any).playerData }, imagery: { ...c.imagery, ...(patch as any).imagery } } : c));
  }, []);

  const updatePlayer = useCallback((idx: number, patch: Partial<PlayerData>) => {
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, playerData: { ...c.playerData, ...patch } } : c));
  }, []);

  const updateImageProps = useCallback((idx: number, patch: Partial<{ offsetX: number; offsetY: number; scalePercent: number }>) => {
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, imagery: { ...c.imagery, imageProperties: { ...c.imagery.imageProperties, ...patch } } } : c));
  }, []);

  const updateLenticularUrl = useCallback((idx: number, urlIdx: number, url: string) => {
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, imagery: { ...c.imagery, lenticularUrls: c.imagery.lenticularUrls.map((u, j) => j === urlIdx ? url : u) } } : c));
  }, []);

  const addLenticularUrl = useCallback((idx: number) => {
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, imagery: { ...c.imagery, lenticularUrls: [...c.imagery.lenticularUrls, ''] } } : c));
  }, []);

  const removeCard = useCallback((idx: number) => setCards(prev => prev.filter((_, i) => i !== idx)), []);

  const generateLink = useCallback(() => {
    const payload: CardSetPayloadV1 = { v: 1, cards };
    const d = base64UrlEncode(payload);
    const url = `${window.location.origin}${window.location.pathname}#/viewer?d=${d}`;
    navigator.clipboard?.writeText(url).catch(()=>{});
    alert(`Viewer link copied to clipboard:\n${url}`);
  }, [cards]);

  const handleSignIn = useCallback(async () => {
    await signIn();
    setSignedInState(isSignedIn());
  }, []);

  const handleSignOut = useCallback(() => {
    signOut();
    setSignedInState(isSignedIn());
  }, []);

  const saveToBackend = useCallback(async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const payload: CardSetPayloadV1 = { v: 1, cards };
      const d = base64UrlEncode(payload);
      const { code } = await saveSet(d);
      const url = `${window.location.origin}${window.location.pathname}#/viewer?s=${encodeURIComponent(code)}`;
      try { await navigator.clipboard?.writeText(url); } catch {}
      alert(`Shortcode link copied to clipboard:\n${url}`);
    } catch (e: any) {
      console.error(e);
      setSaveError(e?.message || 'Save failed');
      alert(`Save failed: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  }, [cards]);

  return (
    <div style={{ paddingTop: 48 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
        <h2 style={{ color: '#fff' }}>Card Creator</h2>
        {cards.map((c, idx) => (
          <div key={idx} style={{ border: '1px solid #333', borderRadius: 8, padding: 12, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#ddd' }}>Card #{idx+1}</strong>
              <button onClick={() => removeCard(idx)} style={{ background: '#300', color: '#fff', border: '1px solid #600', borderRadius: 6, padding: '6px 8px' }}>Remove</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
              <Field label="Rarity"><TextInput value={c.rarity} onChange={e=>updateCard(idx, { rarity: e.target.value as CardRarity })} /></Field>
              <Field label="Types (comma)"><TextInput value={(c.types as string) || ''} onChange={e=>updateCard(idx, { types: e.target.value })} /></Field>
              <Field label="Subtypes (comma)"><TextInput value={(c.subtypes as string) || ''} onChange={e=>updateCard(idx, { subtypes: e.target.value })} /></Field>
              <Field label="Supertype"><TextInput value={c.supertype || ''} onChange={e=>updateCard(idx, { supertype: e.target.value })} /></Field>
            </div>
            <h4 style={{ color: '#ccc', marginTop: 16 }}>Player</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <Field label="Name"><TextInput value={c.playerData.cardName} onChange={e=>updatePlayer(idx,{ cardName: e.target.value })} /></Field>
              <Field label="Team"><TextInput value={c.playerData.teamName} onChange={e=>updatePlayer(idx,{ teamName: e.target.value })} /></Field>
              <Field label="Position"><TextInput value={c.playerData.positionName} onChange={e=>updatePlayer(idx,{ positionName: e.target.value })} /></Field>
              <Field label="Type"><TextInput value={c.playerData.playerType} onChange={e=>updatePlayer(idx,{ playerType: e.target.value as any })} /></Field>
              <Field label="MA"><TextInput value={c.playerData.ma} onChange={e=>updatePlayer(idx,{ ma: e.target.value })} /></Field>
              <Field label="ST"><TextInput value={c.playerData.st} onChange={e=>updatePlayer(idx,{ st: e.target.value })} /></Field>
              <Field label="AG"><TextInput value={c.playerData.ag} onChange={e=>updatePlayer(idx,{ ag: e.target.value })} /></Field>
              <Field label="PA"><TextInput value={c.playerData.pa} onChange={e=>updatePlayer(idx,{ pa: e.target.value })} /></Field>
              <Field label="AV"><TextInput value={c.playerData.av} onChange={e=>updatePlayer(idx,{ av: e.target.value })} /></Field>
              <Field label="Cost"><TextInput value={c.playerData.cost} onChange={e=>updatePlayer(idx,{ cost: e.target.value })} /></Field>
              <Field label="Primary"><TextInput value={c.playerData.primary} onChange={e=>updatePlayer(idx,{ primary: e.target.value })} /></Field>
              <Field label="Secondary"><TextInput value={c.playerData.secondary} onChange={e=>updatePlayer(idx,{ secondary: e.target.value })} /></Field>
              <Field label="Footer"><TextInput value={c.playerData.footer} onChange={e=>updatePlayer(idx,{ footer: e.target.value })} /></Field>
              <Field label="Skills & Traits" ><TextArea rows={3} value={c.playerData.skillsAndTraits} onChange={e=>updatePlayer(idx,{ skillsAndTraits: e.target.value })} /></Field>
            </div>
            <h4 style={{ color: '#ccc', marginTop: 16 }}>Imagery</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Field label="Offset X"><TextInput type="number" value={c.imagery.imageProperties.offsetX} onChange={e=>updateImageProps(idx,{ offsetX: Number(e.target.value) })} /></Field>
              <Field label="Offset Y"><TextInput type="number" value={c.imagery.imageProperties.offsetY} onChange={e=>updateImageProps(idx,{ offsetY: Number(e.target.value) })} /></Field>
              <Field label="Scale %"><TextInput type="number" value={c.imagery.imageProperties.scalePercent} onChange={e=>updateImageProps(idx,{ scalePercent: Number(e.target.value) })} /></Field>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ color: '#bbb' }}>Lenticular URLs</span>
                <button onClick={() => addLenticularUrl(idx)} style={{ background: '#113311', color: '#fff', border: '1px solid #225522', borderRadius: 6, padding: '6px 8px' }}>Add URL</button>
              </div>
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {c.imagery.lenticularUrls.map((u, j) => (
                  <TextInput key={j} placeholder={`Image URL ${j+1}`} value={u} onChange={e=>updateLenticularUrl(idx, j, e.target.value)} />
                ))}
              </div>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addCard} style={{ background: '#113311', color: '#fff', border: '1px solid #225522', borderRadius: 6, padding: '8px 12px' }}>Add Card</button>
            <button onClick={generateLink} style={{ background: '#113355', color: '#fff', border: '1px solid #225577', borderRadius: 6, padding: '8px 12px' }}>Generate Viewer Link</button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#aaa', fontSize: 12 }}>Backend save (optional)</span>
            {signedInState ? (
              <button onClick={handleSignOut} style={{ background: '#552222', color: '#fff', border: '1px solid #774444', borderRadius: 6, padding: '8px 12px' }}>Sign out</button>
            ) : (
              <button onClick={handleSignIn} style={{ background: '#224455', color: '#fff', border: '1px solid #446677', borderRadius: 6, padding: '8px 12px' }}>Sign in</button>
            )}
            <button onClick={saveToBackend} disabled={!signedInState || saving} style={{ opacity: (!signedInState || saving) ? 0.6 : 1, background: '#225522', color: '#fff', border: '1px solid #447744', borderRadius: 6, padding: '8px 12px' }}>{saving ? 'Saving…' : 'Save & get shortcode'}</button>
          </div>
        </div>
        {saveError && <div style={{ color: '#f99', marginTop: 8 }}>Error: {saveError}</div>}
      </div>
    </div>
  );
}
