import {
    FantasyFootballCardSerializable, type CardSetPayloadV1, FantasyFootballPlayerData, AnyPayload, CardGlowType,
    CardHoloTypes
} from "../types";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {isSignedIn, signIn, signOut} from "../services/auth";
import {base64UrlEncode, base64UrlDecode} from "../utils/codec";
import {saveSet, loadSet} from "../services/backend";
import FantasyFootballCard, {CardRarity} from "./fantasyFootballCard/FantasyFootballCard";
import {FantasyFootballCardData} from "./fantasyFootballCard/fantasyFootballRender";
import {parseQuery, useHashRoute} from "../utils/UseHashRoute";
import { TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import {
    deleteDeck,
    getCurrentDeckId,
    getDeck,
    listDecks,
    nextUntitledName,
    renameDeck as renameDeckLs,
    saveDeck as saveDeckLs,
    setCurrentDeckId
} from "../services/localDecks";
import {
    ArrowRightEndOnRectangleIcon,
    CloudArrowUpIcon,
    DocumentDuplicateIcon,
    DocumentPlusIcon
} from "@heroicons/react/16/solid";
import {toast} from "react-toastify";
import {isLocalImageUrl, localImageUrl, saveImageFile} from "../services/localImages";
import { TeamData } from "./data";

function Field({label, children}: { label: string; children: React.ReactNode }) {
    return (
        <label className="grid gap-1.5">
            <span className="text-xs text-neutral-200">{label}</span>
            {children}
        </label>
    );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const {className, ...rest} = props as any;
    return (
        <input
            {...rest}
            className={`${className ?? ''} px-2.5 py-2 rounded-md border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500`}
        />
    );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const {className, ...rest} = props as any;
    return (
        <textarea
            {...rest}
            className={`${className ?? ''} px-2.5 py-2 rounded-md border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500`}
        />
    );
}

function CollapsibleSection({ title, defaultOpen = true, children }:{ title: string; defaultOpen?: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState<boolean>(defaultOpen);
    return (
        <section className="mt-4 border border-neutral-700/70 rounded-lg overflow-hidden">
            <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 bg-neutral-800/70 hover:bg-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                aria-expanded={open}
                onClick={() => setOpen(o => !o)}
            >
                <span className="text-neutral-300 font-medium">{title}</span>
                <svg
                    className={`h-4 w-4 text-neutral-300 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {open && (
                <div className="p-3 bg-neutral-800/40">
                    {children}
                </div>
            )}
        </section>
    );
}

export function CardCreator() {


    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [signedInState, setSignedInState] = useState<boolean>(isSignedIn());

    // Local deck identity for Creator
    const [deckId, setDeckId] = useState<string | null>(getCurrentDeckId());
    const [deckName, setDeckName] = useState<string>(() => getDeck(getCurrentDeckId() || undefined)?.name || '');

    const emptyPlayer: FantasyFootballPlayerData = {
        ag: '',
        av: '',
        ma: '',
        pa: '',
        st: '',
        playerType: 'normal',
        teamName: deckName || '',
        cost: '',
        cardName: '',
        skillsAndTraits: '',
        positionName: '',
        primary: '',
        secondary: '',
        footer: '',
        notes: ''
    };

    const emptyImagery = {
        imageProperties: {offsetX: 0, offsetY: 0, scalePercent: 100},
        lenticularUrls: {'0': '/img/players/blank-player.jpg'}
    }

    const [cards, setCards] = useState<FantasyFootballCardSerializable[]>([{
        rarity: 'common',
        playerData: emptyPlayer,
        imagery: emptyImagery
    }]);

    // Available glow types (from enum)
    const glowOptions = Object.keys(CardGlowType).filter(k => isNaN(Number(k as any)));

    // Team/Template selection for new cards
    const teamNames = useMemo(() => Object.keys(TeamData), []);
    const initialTeam = useMemo(() => {
        if (deckName && teamNames.includes(deckName)) return deckName;
        return teamNames[0] || '';
    }, [deckName, teamNames]);
    const [selectedTeam, setSelectedTeam] = useState<string>(initialTeam);
    const selectedTeamPlayers = useMemo(() => {
        const mod = (TeamData as any)[selectedTeam] as any;
        const data = mod?.default ?? mod;
        return Array.isArray(data) ? data : [];
    }, [selectedTeam]);
    const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number>(0);

    useEffect(() => {
        // Reset player template to first when team changes
        setSelectedTemplateIdx(0);
    }, [selectedTeam]);

    useEffect(() => {
        // If deckName matches a team, set as selected when deck changes
        if (deckName && teamNames.includes(deckName)) {
            setSelectedTeam(deckName);
        }
    }, [deckName, teamNames]);

    // Remix support: if arriving on /create with ?d= or ?s=, preload those cards for editing
    const hash = useHashRoute();
    const [, routeAndQuery] = hash.split('#');
    const [route, queryString] = (routeAndQuery || '/create').split('?');
    const q = parseQuery(queryString || '');

    useEffect(() => {
        let cancelled = false;
        async function loadFromQueryOrCurrentDeck() {
            try {
                if (route !== '/create') return;
                if (q.d) {
                    const payload = base64UrlDecode<AnyPayload>(q.d);
                    if ((payload as any)?.v === 1) {
                        if (!cancelled) setCards((payload as AnyPayload).cards);
                        const cid = getCurrentDeckId();
                        setDeckId(cid);
                        setDeckName(getDeck(cid || undefined)?.name || '');
                        return;
                    }
                } else if (q.s) {
                    const {data} = await loadSet(q.s);
                    const payload = base64UrlDecode<AnyPayload>(data);
                    if ((payload as any)?.v === 1) {
                        if (!cancelled) setCards((payload as AnyPayload).cards);
                        // editing shortcode is unsaved deck until user saves
                        setDeckId(getCurrentDeckId());
                        setDeckName(getDeck(getCurrentDeckId() || undefined)?.name || '');
                        return;
                    }
                }
                // No query payloads; try current deck
                const curId = getCurrentDeckId();
                const deck = getDeck(curId || undefined);
                if (deck) {
                    const payload = base64UrlDecode<AnyPayload>(deck.data);
                    if ((payload as any)?.v === 1) {
                        if (!cancelled) setCards((payload as AnyPayload).cards);
                        setDeckId(deck.id);
                        setDeckName(deck.name);
                    }
                }
            } catch (e) {
                // ignore and keep defaults
                console.error('Failed to load remix/deck set', e);
            }
        }
        loadFromQueryOrCurrentDeck();
        return () => {
            cancelled = true;
        }
    }, [route, q.d, q.s]);

    // Keep the creator URL in-sync with the current cards so the View link can display them
    // Debounced: wait 2s after the last change before updating the URL
    useEffect(() => {
        if (route !== '/create') return;
        const timer = window.setTimeout(() => {
            try {
                const payload: CardSetPayloadV1 = {v: 1, cards};
                const d = base64UrlEncode(payload);

                // Parse existing params
                const [, rq] = (window.location.hash || '#/create').split('#');
                const [r, qs] = (rq || '/create').split('?');
                const params = new URLSearchParams(qs || '');
                const currentD = params.get('d') || '';

                if (currentD !== d) {
                    params.set('d', d);
                    // remove backend shortcode to avoid ambiguity with live data edits
                    params.delete('s');
                    const newHash = `#/create?${params.toString()}`;
                    const newUrl = `${window.location.pathname}${newHash}`;
                    // Replace without adding history entries, and notify listeners
                    history.replaceState(null, '', newUrl);
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                }
            } catch (e) {
                // no-op
            }
        }, 2000);
        return () => window.clearTimeout(timer);
    }, [cards, route]);

    const addCard = useCallback((duplicate = false) => {
        if (duplicate) {
            const lastCard = cards[cards.length - 1];
            setCards(prev => [...prev, {
                ...lastCard,
            }]);
            return;
        }
        const template = selectedTeamPlayers[selectedTemplateIdx] as Partial<FantasyFootballPlayerData> | undefined;
        const playerData: FantasyFootballPlayerData = template
            ? { ...(template as any) }
            : { ...emptyPlayer };
        setCards(prev => [...prev, {
            rarity: 'common',
            playerData,
            imagery: {
                ...emptyImagery
            }
        }]);
    }, [cards, selectedTeamPlayers, selectedTemplateIdx]);

    const updateCard = useCallback((idx: number, patch: Partial<FantasyFootballCardSerializable>) => {
        setCards(prev => prev.map((c, i) => i === idx ? {
            ...c, ...patch,
            playerData: {...c.playerData, ...(patch as any).playerData},
            imagery: {...c.imagery, ...(patch as any).imagery}
        } : c));
    }, []);

    const updatePlayer = useCallback((idx: number, patch: Partial<FantasyFootballCardData>) => {
        setCards(prev => prev.map((c, i) => i === idx ? {...c, playerData: {...c.playerData, ...patch}} : c));
    }, []);

    const updateImageProps = useCallback((idx: number, patch: Partial<{
        offsetX: number;
        offsetY: number;
        scalePercent: number
    }>) => {
        setCards(prev => prev.map((c, i) => i === idx ? {
            ...c,
            imagery: {...c.imagery, imageProperties: {...c.imagery.imageProperties, ...patch}}
        } : c));
    }, []);

    const updateLenticularUrl = useCallback((idx: number, key: string, url: string) => {
        setCards(prev => prev.map((c, i) => {
            if (i===idx) {
                c.imagery.lenticularUrls[key] = url
            }
            return c;
        }))
    }, []);

    const addLenticularUrl = useCallback((idx: number, key: string) => {
        setCards(prev => prev.map((c, i) => {
            if (i===idx) {
                c.imagery.lenticularUrls[key] = ''
            }
            return c;
        }));
    }, []);

    const removeCard = useCallback((idx: number) => setCards(prev => prev.filter((_, i) => i !== idx)), []);

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
            const payload: CardSetPayloadV1 = {v: 1, cards};
            const d = base64UrlEncode(payload);
            const {code} = await saveSet(d);
            const url = `${window.location.origin}${window.location.pathname}#/viewer?s=${encodeURIComponent(code)}`;
            try {
                await navigator.clipboard?.writeText(url);
            } catch {
            }
            toast(`Shortcode link copied to clipboard:\n${url}`);
        } catch (e: any) {
            console.error(e);
            setSaveError(e?.message || 'Save failed');
            toast(`Save failed: ${e?.message || e}`, {type: 'error'});
        } finally {
            setSaving(false);
        }
    }, [cards]);

    function cardForm(cardDeckNo: number, c: FantasyFootballCardSerializable) {

        // Normalize current type to a single glow string (or empty)
        const currentTypesValue = Array.isArray(c.types)
            ? (c.types[0] || '')
            : (typeof c.types === 'string' ? (c.types || '') : '');
        const selectedGlow = glowOptions.includes(currentTypesValue as string) ? (currentTypesValue as string) : '';
        const selectedHolo = CardHoloTypes.find(t => t.rarity === c.rarity)?.rarity || "";

        return <div key={cardDeckNo}
                    className="rounded-xl border border-neutral-700/70 bg-neutral-800/60 backdrop-blur-sm shadow-md p-4 mt-4">
            <div className="flex justify-between items-center">
                <strong className="text-neutral-300 font-semibold">Card #{cardDeckNo + 1}: {c.playerData.cardName}</strong>
                <button onClick={() => removeCard(cardDeckNo)}
                        className="bg-red-900 text-white border border-red-700 rounded-md px-2 py-1.5 hover:bg-red-800">
                    <TrashIcon className="h-4 w-4"/>
                </button>

            </div>

            <div className="lg:grid lg:grid-cols-2 lg:gap-6">
                {/* Left column: sticky preview on large screens */}
                <div className="justify-between items-center grid grid-cols-2 md:grid-cols-3 lg:block lg:sticky lg:top-4 self-start">
                    <Field label="Card Preview">
                        <FantasyFootballCard {...c} />
                    </Field>
                </div>

                {/* Right column: form sections */}
                <div>
                    <CollapsibleSection title="Player Data" defaultOpen={false}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
                            <Field label="Name"><TextInput value={c.playerData.cardName}
                                                           onChange={e => updatePlayer(cardDeckNo, {cardName: e.target.value})}/></Field>
                            <Field label="Team"><TextInput value={c.playerData.teamName}
                                                           onChange={e => updatePlayer(cardDeckNo, {teamName: e.target.value})}/></Field>
                            <Field label="Position"><TextInput value={c.playerData.positionName}
                                                               onChange={e => updatePlayer(cardDeckNo, {positionName: e.target.value})}/></Field>
                            <Field label="Cost"><TextInput value={c.playerData.cost}
                                                           onChange={e => updatePlayer(cardDeckNo, {cost: e.target.value})}/></Field>
                            <Field label="Skills & Traits"><TextArea rows={3} value={c.playerData.skillsAndTraits}
                                                                     onChange={e => updatePlayer(cardDeckNo, {skillsAndTraits: e.target.value})}/></Field>
                            <Field label="Primary Growth Areas"><TextInput value={c.playerData.primary}
                                                          onChange={e => updatePlayer(cardDeckNo, {primary: e.target.value})}/></Field>
                            <Field label="Secondary Growth Areas"><TextInput value={c.playerData.secondary}
                                                            onChange={e => updatePlayer(cardDeckNo, {secondary: e.target.value})}/></Field>
                            <Field label="Card Footer"><TextInput value={c.playerData.footer}
                                                             onChange={e => updatePlayer(cardDeckNo, {footer: e.target.value})}/></Field>
                            <Field label="Notes"><TextArea rows={4} value={c.playerData.notes || ''}
                                                             placeholder="Player notes (not visible on card)"
                                                             onChange={e => updatePlayer(cardDeckNo, {notes: e.target.value})}/></Field>
                        </div>
                        <Field label="Stats">
                        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3">
                            <Field label="MA"><TextInput value={c.playerData.ma}
                                                         className={'field-sizing-fixed w-15 '}
                                                         onChange={e => updatePlayer(cardDeckNo, {ma: e.target.value})}/></Field>
                            <Field label="ST"><TextInput value={c.playerData.st}
                                                         className={'field-sizing-fixed w-15 '}
                                                         onChange={e => updatePlayer(cardDeckNo, {st: e.target.value})}/></Field>
                            <Field label="AG"><TextInput value={c.playerData.ag}
                                                         className={'field-sizing-fixed w-15 '}
                                                         onChange={e => updatePlayer(cardDeckNo, {ag: e.target.value})}/></Field>
                            <Field label="PA"><TextInput value={c.playerData.pa}
                                                         className={'field-sizing-fixed w-15 '}
                                                         onChange={e => updatePlayer(cardDeckNo, {pa: e.target.value})}/></Field>
                            <Field label="AV"><TextInput value={c.playerData.av}
                                                         className={'field-sizing-fixed w-15 '}
                                                         onChange={e => updatePlayer(cardDeckNo, {av: e.target.value})}/></Field>
                        </div>
                        </Field>
                    </CollapsibleSection>

                    <CollapsibleSection title="Imagery and Effects" defaultOpen={false}>
                        <div className="text-xs mb-2 mt-4">
                            Input a cloud hosted url for maximum portability or use a local image file. Use the offsets to move the image
                            around and center the player on the card.
                        </div>
                        <div>
                            <div className="grid gap-2 mt-2">
                                <Field label="Player Image">
                                    {Object.keys(c.imagery.lenticularUrls).map((u, j) => (
                                        <div key={j} className="flex flex-col gap-1">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                <TextInput placeholder={`Image URL ${j + 1}`} value={c.imagery.lenticularUrls[u]}
                                                           onChange={e => updateLenticularUrl(cardDeckNo, u, e.target.value)} />
                                                <label className="inline-flex items-center gap-1 text-xs">
                                                    <span className="sr-only">Upload image for slot {j + 1}</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            try {
                                                                const img = await saveImageFile(file);
                                                                updateLenticularUrl(cardDeckNo, u, localImageUrl(img.id));
                                                                toast(`Image uploaded to this device only`);
                                                            } catch (err) {
                                                                toast(`Failed to load image`, { type: 'error' });
                                                            } finally {
                                                            }
                                                        }}
                                                        className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border file:border-neutral-700 file:bg-neutral-900 file:text-white"
                                                    />
                                                </label>
                                            </div>
                                            {isLocalImageUrl(c.imagery.lenticularUrls[u]) && (
                                                <div className="text-amber-300 text-xs mb-2">
                                                    This card will only display correctly on this device.
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </Field>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <Field label="Image Offset X"><TextInput type="number" inputMode="numeric" value={c.imagery.imageProperties.offsetX}
                                                           onChange={e => updateImageProps(cardDeckNo, {offsetX: Number(e.target.value)})}/></Field>
                            <Field label="Image Offset Y"><TextInput type="number" inputMode="numeric" value={c.imagery.imageProperties.offsetY}
                                                           onChange={e => updateImageProps(cardDeckNo, {offsetY: Number(e.target.value)})}/></Field>
                            <Field label="Scale %"><TextInput type="number"
                                                              value={c.imagery.imageProperties.scalePercent}
                                                              onChange={e => updateImageProps(cardDeckNo, {scalePercent: Number(e.target.value)})}/></Field>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <Field label="Holo Effect">
                                <select
                                    className="px-2.5 py-2 rounded-md border border-neutral-700 bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                                    value={selectedHolo}
                                    onChange={e => {
                                        const v = e.target.value;
                                        updateCard(cardDeckNo, {rarity: v as CardRarity})
                                    }}>
                                    <option value="">(none)</option>
                                    {CardHoloTypes.map((typ) => (
                                        <option key={typ.label} value={typ.rarity}>{typ.label}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Glow Color">
                                <select
                                    className="px-2.5 py-2 rounded-md border border-neutral-700 bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                                    value={selectedGlow}
                                    onChange={e => {
                                        const v = e.target.value;
                                        updateCard(cardDeckNo, { types: v ? v : undefined });
                                    }}>
                                    <option value="">White</option>
                                    {glowOptions.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </CollapsibleSection>
                </div>
            </div>
        </div>;
    }

    return (
        <div className="pt-1 px-3 md:px-4 pb-28">
            <div className="max-w-[900px] lg:max-w-[1400px] mx-auto space-y-4">
                <div
                    className="rounded-xl border border-neutral-700/60 bg-neutral-800/60 backdrop-blur-sm shadow-lg px-4 py-3">
                    <h2 className="text-neutral-100 text-2xl font-semibold">Deck Editor</h2>
                    <p className="text-neutral-300 text-sm mt-1">Build one or more cards into a deck. All fields are optional unless your card art requires specific properties.</p>

                    {/* Deck storage controls */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Field label="Deck Name"><TextInput value={deckName || ''}
                                                       onChange={e => {
                                                           const current = deckName || getDeck(deckId || undefined)?.name || '';
                                                           const name = e.target.value
                                                           if (!name) return;
                                                           if (!deckId) {
                                                               // If unsaved, just set local name; will apply on first save
                                                               setDeckName(name);
                                                               return;
                                                           }
                                                           const updated = renameDeckLs(deckId, name.trim());
                                                           if (updated) {
                                                               setDeckName(updated.name.trim());
                                                           }
                                                       }}/></Field>

                        <div className={'mt-5.5'}>
                            <button
                                onClick={() => {
                                    try {
                                        const payload: CardSetPayloadV1 = { v: 1, cards };
                                        const d = base64UrlEncode(payload);
                                        const saved = saveDeckLs({ id: deckId, name: deckName || undefined, data: d });
                                        setCurrentDeckId(saved.id);
                                        setDeckId(saved.id);
                                        setDeckName(saved.name);
                                        // reflect in URL immediately
                                        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
                                        params.set('d', saved.data);
                                        params.delete('s');
                                        history.replaceState(null, '', `${window.location.pathname}#/create?${params.toString()}`);
                                        window.dispatchEvent(new HashChangeEvent('hashchange'));
                                        toast('Deck saved');
                                    } catch (e) {
                                        toast('Failed to save deck', { type: 'error' });
                                        console.error(e)
                                    }
                                }}
                                className="bg-emerald-700 text-white border border-emerald-600 rounded-md px-3 py-1.5 mr-2 hover:bg-emerald-600">
                                <ArrowRightEndOnRectangleIcon title={'Save to Device'} className={'h-7 w-7'}/>
                            </button>
                            <button
                                onClick={() => {
                                    const name = nextUntitledName();
                                    const defaultCards: FantasyFootballCardSerializable[] = [{
                                        rarity: 'common',
                                        playerData: emptyPlayer,
                                        imagery: emptyImagery
                                    }];
                                    const d = base64UrlEncode({ v: 1, cards: defaultCards });
                                    const saved = saveDeckLs({ name, data: d });
                                    setCurrentDeckId(saved.id);
                                    setDeckId(saved.id);
                                    setDeckName(saved.name);
                                    setCards(defaultCards);
                                    history.replaceState(null, '', `${window.location.pathname}#/create?d=${saved.data}`);
                                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                                }}
                                className="bg-sky-800 text-white border border-sky-700 rounded-md px-3 py-1.5 mr-2 hover:bg-sky-700">
                                <PlusIcon title={'Create new Deck'} className="h-7 w-7"/>
                            </button>
                            <button
                                onClick={() => {
                                    if (!deckId) {
                                        // Nothing to delete for unsaved deck; clear fields
                                        if (confirm('Discard current unsaved changes and start a new deck?')) {
                                            const name = nextUntitledName();
                                            const defaultCards: FantasyFootballCardSerializable[] = [{
                                                rarity: 'common',
                                                playerData: emptyPlayer,
                                                imagery: emptyImagery
                                            }];
                                            setCards(defaultCards);
                                            setDeckName('');
                                            history.replaceState(null, '', `${window.location.pathname}#/create`);
                                            window.dispatchEvent(new HashChangeEvent('hashchange'));
                                        }
                                        return;
                                    }
                                    const deck = getDeck(deckId);
                                    const ok = confirm(`Delete deck "${deck?.name || 'Untitled'}"? This cannot be undone.`);
                                    if (!ok) return;
                                    deleteDeck(deckId);
                                    // Choose next deck or create fresh unsaved
                                    const remaining = listDecks();
                                    if (remaining.length > 0) {
                                        const next = remaining[0];
                                        setCurrentDeckId(next.id);
                                        setDeckId(next.id);
                                        setDeckName(next.name);
                                        try {
                                            const payload = base64UrlDecode<AnyPayload>(next.data);
                                            if ((payload as any)?.v === 1) setCards((payload as AnyPayload).cards);
                                        } catch {}
                                        history.replaceState(null, '', `${window.location.pathname}#/create?d=${next.data}`);
                                    } else {
                                        setCurrentDeckId(null);
                                        setDeckId(null);
                                        setDeckName('');
                                        const defaultCards: FantasyFootballCardSerializable[] = [{
                                            rarity: 'common',
                                            playerData: emptyPlayer,
                                            imagery: emptyImagery
                                        }];
                                        setCards(defaultCards);
                                        history.replaceState(null, '', `${window.location.pathname}#/create`);
                                    }
                                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                                }}
                                className="bg-red-800 text-white border border-red-700 rounded-md px-3 py-1.5 mr-2 hover:bg-red-700"
                            >
                                <TrashIcon title={'Delete Deck'} className="h-7 w-7"/>
                            </button>
                        </div>
                    </div>
                </div>
                {cards.map((c, idx) => cardForm(idx, c))}
                <div className="flex justify-between items-center gap-2 mt-4 flex-wrap">
                    <div className="flex items-end gap-3 flex-wrap">
                        <Field label="From Team">
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="px-2.5 py-2 rounded-md border border-neutral-700 bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                            >
                                {teamNames.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Player Type">
                            <select
                                value={String(selectedTemplateIdx)}
                                onChange={(e) => setSelectedTemplateIdx(Number(e.target.value))}
                                className="px-2.5 py-2 rounded-md border border-neutral-700 bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                            >
                                {selectedTeamPlayers.length === 0 && (
                                    <option value={0}>No templates</option>
                                )}
                                {selectedTeamPlayers.map((p: any, i: number) => (
                                    <option key={i} value={i}>
                                        {(p.cardName || p.positionName || `Player ${i+1}`)}{p.cost ? ` — ${p.cost}` : ''}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <button onClick={()=> {
                            addCard()
                        }}
                        title="Add New Player"
                                className="bg-green-900 text-white border border-green-700 rounded-md px-3 py-2 hover:bg-green-800">
                            <DocumentPlusIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => {
                            addCard(true)
                        }}
                        title="Duplicate Last"
                                className="bg-green-900 text-white border border-green-700 rounded-md px-3 py-2 hover:bg-green-800">
                            <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                {saveError && <div className="text-rose-300 mt-2">Error: {saveError}</div>}
            </div>
        </div>
    );
}