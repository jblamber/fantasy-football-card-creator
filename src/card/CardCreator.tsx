import {CardSerializable, type CardSetPayloadV1, PlayerData} from "../types";
import React, {useCallback, useState} from "react";
import {isSignedIn, signIn, signOut} from "../services/auth";
import {base64UrlEncode} from "../utils/codec";
import {saveSet} from "../services/backend";
import {CardRarity} from "../bloodbowl/FantasyFootballCard";


function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="grid gap-1.5">
            <span className="text-xs text-neutral-200">{label}</span>
            {children}
        </label>
    );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const { className, ...rest } = props as any;
    return (
        <input
            {...rest}
            className={`${className ?? ''} px-2.5 py-2 rounded-md border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500`}
        />
    );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const { className, ...rest } = props as any;
    return (
        <textarea
            {...rest}
            className={`${className ?? ''} px-2.5 py-2 rounded-md border border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500`}
        />
    );
}

export function CardCreator() {
    const emptyPlayer: PlayerData = {
        ag: '',
        av: '',
        ma: '',
        pa: '',
        st: '',
        playerType: 'normal',
        teamName: '',
        cost: '',
        cardName: '',
        skillsAndTraits: '',
        positionName: '',
        primary: '',
        secondary: '',
        footer: ''
    };
    const [cards, setCards] = useState<CardSerializable[]>([{
        rarity: 'common',
        playerData: emptyPlayer,
        imagery: {
            imageProperties: {offsetX: 0, offsetY: 0, scalePercent: 100},
            lenticularUrls: ['/img/players/grail1.png']
        }
    }]);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [signedInState, setSignedInState] = useState<boolean>(isSignedIn());

    const addCard = useCallback(() => {
        setCards(prev => [...prev, {
            rarity: 'common',
            playerData: {...emptyPlayer},
            imagery: {imageProperties: {offsetX: 0, offsetY: 0, scalePercent: 100}, lenticularUrls: []}
        }]);
    }, []);

    const updateCard = useCallback((idx: number, patch: Partial<CardSerializable>) => {
        setCards(prev => prev.map((c, i) => i === idx ? {
            ...c, ...patch,
            playerData: {...c.playerData, ...(patch as any).playerData},
            imagery: {...c.imagery, ...(patch as any).imagery}
        } : c));
    }, []);

    const updatePlayer = useCallback((idx: number, patch: Partial<PlayerData>) => {
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

    const updateLenticularUrl = useCallback((idx: number, urlIdx: number, url: string) => {
        setCards(prev => prev.map((c, i) => i === idx ? {
            ...c,
            imagery: {...c.imagery, lenticularUrls: c.imagery.lenticularUrls.map((u, j) => j === urlIdx ? url : u)}
        } : c));
    }, []);

    const addLenticularUrl = useCallback((idx: number) => {
        setCards(prev => prev.map((c, i) => i === idx ? {
            ...c,
            imagery: {...c.imagery, lenticularUrls: [...c.imagery.lenticularUrls, '']}
        } : c));
    }, []);

    const removeCard = useCallback((idx: number) => setCards(prev => prev.filter((_, i) => i !== idx)), []);

    const generateLink = useCallback(() => {
        const payload: CardSetPayloadV1 = {v: 1, cards};
        const d = base64UrlEncode(payload);
        const url = `${window.location.origin}${window.location.pathname}#/viewer?d=${d}`;
        navigator.clipboard?.writeText(url).catch(() => {
        });
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
            const payload: CardSetPayloadV1 = {v: 1, cards};
            const d = base64UrlEncode(payload);
            const {code} = await saveSet(d);
            const url = `${window.location.origin}${window.location.pathname}#/viewer?s=${encodeURIComponent(code)}`;
            try {
                await navigator.clipboard?.writeText(url);
            } catch {
            }
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
        <div className="pt-12 px-3 md:px-4 pb-28">
            <div className="max-w-[900px] mx-auto space-y-4">
                <div
                    className="rounded-xl border border-neutral-700/60 bg-neutral-800/60 backdrop-blur-sm shadow-lg px-4 py-3">
                    <h2 className="text-neutral-100 text-2xl font-semibold">Card Creator</h2>
                    <p className="text-neutral-300 text-sm mt-1">Build one or more cards, then generate a share link or
                        save a shortcode. All fields are optional unless your card art requires specific properties.</p>
                </div>
                {cards.map((c, idx) => (
                    <div key={idx}
                         className="rounded-xl border border-neutral-700/70 bg-neutral-800/60 backdrop-blur-sm shadow-md p-4 mt-4">
                        <div className="flex justify-between items-center">
                            <strong className="text-neutral-300 font-semibold">Card #{idx + 1}</strong>
                            <button onClick={() => removeCard(idx)}
                                    className="bg-red-900 text-white border border-red-700 rounded-md px-2 py-1.5 hover:bg-red-800">Remove
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <Field label="Rarity"><TextInput value={c.rarity}
                                                             onChange={e => updateCard(idx, {rarity: e.target.value as CardRarity})}/></Field>
                            <Field label="Types (comma)"><TextInput value={(c.types as string) || ''}
                                                                    onChange={e => updateCard(idx, {types: e.target.value})}/></Field>
                            <Field label="Subtypes (comma)"><TextInput value={(c.subtypes as string) || ''}
                                                                       onChange={e => updateCard(idx, {subtypes: e.target.value})}/></Field>
                            <Field label="Supertype"><TextInput value={c.supertype || ''}
                                                                onChange={e => updateCard(idx, {supertype: e.target.value})}/></Field>
                        </div>
                        <h4 className="text-neutral-300 mt-4">Player</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            <Field label="Name"><TextInput value={c.playerData.cardName}
                                                           onChange={e => updatePlayer(idx, {cardName: e.target.value})}/></Field>
                            <Field label="Team"><TextInput value={c.playerData.teamName}
                                                           onChange={e => updatePlayer(idx, {teamName: e.target.value})}/></Field>
                            <Field label="Position"><TextInput value={c.playerData.positionName}
                                                               onChange={e => updatePlayer(idx, {positionName: e.target.value})}/></Field>
                            <Field label="Type"><TextInput value={c.playerData.playerType}
                                                           onChange={e => updatePlayer(idx, {playerType: e.target.value as any})}/></Field>
                            <Field label="MA"><TextInput value={c.playerData.ma}
                                                         onChange={e => updatePlayer(idx, {ma: e.target.value})}/></Field>
                            <Field label="ST"><TextInput value={c.playerData.st}
                                                         onChange={e => updatePlayer(idx, {st: e.target.value})}/></Field>
                            <Field label="AG"><TextInput value={c.playerData.ag}
                                                         onChange={e => updatePlayer(idx, {ag: e.target.value})}/></Field>
                            <Field label="PA"><TextInput value={c.playerData.pa}
                                                         onChange={e => updatePlayer(idx, {pa: e.target.value})}/></Field>
                            <Field label="AV"><TextInput value={c.playerData.av}
                                                         onChange={e => updatePlayer(idx, {av: e.target.value})}/></Field>
                            <Field label="Cost"><TextInput value={c.playerData.cost}
                                                           onChange={e => updatePlayer(idx, {cost: e.target.value})}/></Field>
                            <Field label="Primary"><TextInput value={c.playerData.primary}
                                                              onChange={e => updatePlayer(idx, {primary: e.target.value})}/></Field>
                            <Field label="Secondary"><TextInput value={c.playerData.secondary}
                                                                onChange={e => updatePlayer(idx, {secondary: e.target.value})}/></Field>
                            <Field label="Footer"><TextInput value={c.playerData.footer}
                                                             onChange={e => updatePlayer(idx, {footer: e.target.value})}/></Field>
                            <Field label="Skills & Traits"><TextArea rows={3} value={c.playerData.skillsAndTraits}
                                                                     onChange={e => updatePlayer(idx, {skillsAndTraits: e.target.value})}/></Field>
                        </div>
                        <h4 className="text-neutral-300 mt-4">Imagery</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Field label="Offset X"><TextInput type="number" value={c.imagery.imageProperties.offsetX}
                                                               onChange={e => updateImageProps(idx, {offsetX: Number(e.target.value)})}/></Field>
                            <Field label="Offset Y"><TextInput type="number" value={c.imagery.imageProperties.offsetY}
                                                               onChange={e => updateImageProps(idx, {offsetY: Number(e.target.value)})}/></Field>
                            <Field label="Scale %"><TextInput type="number"
                                                              value={c.imagery.imageProperties.scalePercent}
                                                              onChange={e => updateImageProps(idx, {scalePercent: Number(e.target.value)})}/></Field>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-neutral-400">Lenticular URLs</span>
                                <button onClick={() => addLenticularUrl(idx)}
                                        className="bg-green-900 text-white border border-green-700 rounded-md px-2 py-1.5 hover:bg-green-800">Add
                                    URL
                                </button>
                            </div>
                            <div className="grid gap-2 mt-2">
                                {c.imagery.lenticularUrls.map((u, j) => (
                                    <TextInput key={j} placeholder={`Image URL ${j + 1}`} value={u}
                                               onChange={e => updateLenticularUrl(idx, j, e.target.value)}/>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
                <div className="flex justify-between items-center gap-2 mt-4 flex-wrap">
                    <div className="flex gap-2">
                        <button onClick={addCard}
                                className="bg-green-900 text-white border border-green-700 rounded-md px-3 py-2 hover:bg-green-800">Add
                            Card
                        </button>
                        <button onClick={generateLink}
                                className="bg-sky-900 text-white border border-sky-700 rounded-md px-3 py-2 hover:bg-sky-800">Generate
                            Viewer Link
                        </button>
                    </div>
                    <div className="flex gap-2 items-center">
                        <span className="text-neutral-400 text-xs">Backend save (optional)</span>
                        {signedInState ? (
                            <button onClick={handleSignOut}
                                    className="bg-red-900 text-white border border-red-700 rounded-md px-3 py-2 hover:bg-red-800">Sign
                                out</button>
                        ) : (
                            <button onClick={handleSignIn}
                                    className="bg-sky-900 text-white border border-sky-700 rounded-md px-3 py-2 hover:bg-sky-800">Sign
                                in</button>
                        )}
                        <button onClick={saveToBackend} disabled={!signedInState || saving}
                                className="bg-green-900 text-white border border-green-700 rounded-md px-3 py-2 hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed">{saving ? 'Saving…' : 'Save & get shortcode'}</button>
                    </div>
                </div>
                {saveError && <div className="text-rose-300 mt-2">Error: {saveError}</div>}
            </div>

            {/* Sticky mobile action bar */}
            <div
                className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-700/70 bg-neutral-900/90 backdrop-blur px-3 py-2">
                <div className="max-w-[900px] mx-auto flex gap-2">
                    <button onClick={addCard}
                            className="flex-1 bg-green-700 text-white border border-green-600 rounded-md px-3 py-2.5 text-sm font-medium shadow hover:bg-green-600 active:bg-green-700">Add
                    </button>
                    <button onClick={generateLink}
                            className="flex-1 bg-sky-700 text-white border border-sky-600 rounded-md px-3 py-2.5 text-sm font-medium shadow hover:bg-sky-600 active:bg-sky-700">Link
                    </button>
                    <button onClick={saveToBackend} disabled={!signedInState || saving}
                            className="flex-1 bg-emerald-700 text-white border border-emerald-600 rounded-md px-3 py-2.5 text-sm font-medium shadow hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed">{saving ? 'Saving…' : 'Save'}</button>
                </div>
                {!signedInState && (
                    <p className="max-w-[900px] mx-auto text-[11px] text-neutral-400 mt-1">Sign in above to enable
                        save.</p>
                )}
            </div>
        </div>
    );
}