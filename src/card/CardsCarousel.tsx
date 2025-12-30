import React, {useCallback, useRef, useState} from "react";
import FantasyFootballCard from "./fantasyFootballCard/FantasyFootballCard";
import {ArrowDownTrayIcon} from "@heroicons/react/24/solid";
import { base64UrlEncode } from "../utils/codec";
import { type CardSetPayloadV1 } from "../types";

export function CardsCarousel({cards}: { cards: any[] }) {
    const [index, setIndex] = useState(0);
    const [localCards, setLocalCards] = useState<any[]>(cards);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // keep local copy in sync if parent updates
    React.useEffect(() => {
        setLocalCards(cards);
    }, [cards]);

    // Debounced URL hash sync (1s): persist edits (like notes) into ?d= so Edit button carries them to Creator
    React.useEffect(() => {
        // Only run if there are cards
        if (!localCards || localCards.length === 0) return;
        const timer = window.setTimeout(() => {
            try {
                const payload: CardSetPayloadV1 = { v: 1, cards: localCards as any };
                const d = base64UrlEncode(payload);

                const hash = window.location.hash || '#/viewer';
                const [, rq] = hash.split('#');
                const [routePath, qs] = (rq || '/viewer').split('?');
                const params = new URLSearchParams(qs || '');
                const currentD = params.get('d') || '';
                if (currentD === d) return; // nothing to do

                params.set('d', d);
                // prefer live data over shortcode to avoid ambiguity
                params.delete('s');
                const newHash = `#${routePath || '/viewer'}?${params.toString()}`;
                const newUrl = `${window.location.pathname}${newHash}`;
                history.replaceState(null, '', newUrl);
                // Notify any listeners (App, hooks) that hash changed
                window.dispatchEvent(new HashChangeEvent('hashchange'));
            } catch (e) {
                // ignore
            }
        }, 1000);
        return () => window.clearTimeout(timer);
    }, [localCards]);

    const next = useCallback(() => setIndex(i => (i + 1) % localCards.length), [localCards.length]);
    const prev = useCallback(() => setIndex(i => (i - 1 + localCards.length) % localCards.length), [localCards.length]);
    const onViewportClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 2) prev(); else next();
    }, [next, prev]);

    const sanitize = (s: string) => (s || 'card')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const handleDownload = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const card = localCards[index] || {};
        const name: string = (card.playerData?.cardName || card.playerData?.teamName || 'card');
        const filename = `card-${index + 1}-${sanitize(name) || 'card'}.png`;

        const trigger = (href: string) => {
            const a = document.createElement('a');
            a.href = href;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        if (canvas.toBlob) {
            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                trigger(url);
                // Revoke after a tick to allow download to start
                setTimeout(() => URL.revokeObjectURL(url), 2000);
            }, 'image/png');
        } else {
            try {
                const dataUrl = canvas.toDataURL('image/png');
                trigger(dataUrl);
            } catch {
                // ignore
            }
        }
    }, [localCards, index]);

    return (
        <section
            className="card-viewport h-screen flex p-1 justify-center [touch-action:manipulation]"
            onClick={onViewportClick}>
            {/* Sticky controls bottom-right */}


            <div onClick={(e) => e.stopPropagation()} style={{width: 'min(90vw, calc(90vh * 822 / 1122))'}}
                 className="aspect-[822/1122]">
                <FantasyFootballCard
                    {...localCards[index]}
                    onSwipe={(dir) => {
                        if (dir === 'left') next(); else prev();
                    }}
                    canvasRef={canvasRef}
                />
            </div>

            <div
                className="fixed bottom-28 right-2 z-20 rounded-md py-1 text-white text-sm shadow-md select-none flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="whitespace-nowrap rounded-md border border-neutral-600/70 bg-neutral-700/40 hover:bg-neutral-600/50 active:bg-neutral-600/60 px-1.5 py-1" onClick={next} role="button" aria-label="Next card">
                    <span aria-label="Current card index">{index + 1}</span>
                    <span className="opacity-70"> / </span>
                    <span aria-label="Total cards">{localCards.length}</span>
                </div>
                <button
                    type="button"
                    onClick={handleDownload}
                    title="Download this card as PNG"
                    aria-label="Download card image"
                    className="inline-flex items-center justify-center rounded-md border border-neutral-600/70 bg-neutral-700/40 hover:bg-neutral-600/50 active:bg-neutral-600/60 px-1.5 py-1"
                >
                    <ArrowDownTrayIcon className="w-4 h-4"/>
                </button>
            </div>

            <div
                className="fixed left-0 right-0 bottom-0 z-20 px-2 pb-2"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto max-w-screen-md">
                    <textarea
                        id="card-notes"
                        rows={3}
                        placeholder="Add player notes here"
                        value={(localCards[index]?.playerData?.notes ?? '') as string}
                        onChange={(e) => {
                            const v = e.target.value;
                            setLocalCards(prev => prev.map((c, i) => {
                                if (i !== index) return c;
                                return {
                                    ...c,
                                    playerData: {
                                        ...(c.playerData || {}),
                                        notes: v,
                                    }
                                };
                            }));
                        }}
                        className="w-full resize-none min-h-[64px] max-h-[40vh] px-2.5 py-2 rounded-t-md border border-neutral-700 bg-neutral-900/90 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 backdrop-blur"
                    />
                </div>
            </div>
        </section>
    );
}