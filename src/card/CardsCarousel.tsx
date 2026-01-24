import React, {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";
import FantasyFootballCard from "./fantasyFootballCard/FantasyFootballCard";
import {ArrowDownTrayIcon} from "@heroicons/react/24/solid";
import skillsDataSet from './data/skills.json'
import {Deck, FantasyFootballCardSerializable} from "../types";
import {ArrowPathIcon} from "@heroicons/react/16/solid";
import {saveDeck} from "../localStorage/localDecks";

interface CardsCarouselProps {
    deck: Deck | undefined,
    setCurrentDeck: Dispatch<SetStateAction<Deck | undefined>>
}

export function CardsCarousel({deck, setCurrentDeck}: CardsCarouselProps) {
    const [localCards, setLocalCards] = useState<FantasyFootballCardSerializable[]>(deck?.cards || []);
    const [selectedCardIndex, setSelectedCardIndex] = useState(0);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (!deck) return;
        setLocalCards(deck.cards);
        setSelectedCardIndex(0);
    }, [deck])

    const downloadImageCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [openSkill, setOpenSkill] = useState<string | null>(null);
    const skillData = skillsDataSet.find(s=>s.name?.toLowerCase() === openSkill?.toLowerCase());
    const skills = React.useMemo(() => {
        const raw = ((localCards[selectedCardIndex]?.playerData?.skillsAndTraits ?? '') as string);
        //if (!raw || raw.indexOf(',') === -1) return [] as string[];
        return Array.from(new Set(raw.split(',').map(s => s.trim()).filter(Boolean)));
    }, [localCards, selectedCardIndex]);

    const next = useCallback(() => setSelectedCardIndex(i => (i + 1) % localCards.length), [localCards.length]);
    const prev = useCallback(() => setSelectedCardIndex(i => (i - 1 + localCards.length) % localCards.length), [localCards.length]);
    const onViewportClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 2) prev(); else next();
    }, [next, prev]);

    const sanitizeCardDownloadName = (s: string) => (s || 'card')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const handleDownload = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        const canvas = downloadImageCanvasRef.current;
        if (!canvas) return;
        const card = localCards[selectedCardIndex] || {};
        const name: string = (card.playerData?.cardName || card.playerData?.teamName || 'card');
        const filename = `card-${selectedCardIndex + 1}-${sanitizeCardDownloadName(name) || 'card'}.png`;

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
    }, [localCards, selectedCardIndex]);

    // Debounced URL hash sync (1s): persist edits (like notes) into ?d= so the edit button carries them to Creator
    React.useEffect(() => {
        setIsDirty(true);
        if (!localCards || localCards.length === 0) return;
        const timer = window.setTimeout(() => {
                try {
                    const updatedDeck = {
                        ...deck,
                        cards: localCards,
                    } as Deck;
                    saveDeck(updatedDeck);
                    setCurrentDeck(updatedDeck);
            } catch (e) {
                // ignore
            }
            setIsDirty(false);
        }, 1000);
        return () => {
            setIsDirty(false);
            window.clearTimeout(timer);
        }
    }, [localCards]);


    return (
        <section
            className="card-viewport h-screen flex p-1 justify-center [touch-action:manipulation]"
            data-tour-id="deck-preview"
            onClick={onViewportClick}>
            {/* Sticky controls bottom-right */}

            <div onClick={(e) => e.stopPropagation()}
                 style={{width: 'min(90vw, calc(90vh * 822 / 1122))'}}
                 className="aspect-[822/1122]">
                <FantasyFootballCard
                    {...localCards[selectedCardIndex]}
                    onSwipe={(dir) => {
                        if (dir === 'left') next(); else prev();
                    }}
                    canvasRef={downloadImageCanvasRef}
                />
            </div>

            <div
                data-tour-id="skills"
                className="fixed bottom-28 right-2 z-20 rounded-md py-1 text-white text-sm shadow-md
                select-none flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
            >
                {isDirty && <button
                    type="button"
                    onClick={handleDownload}
                    title="Save Data"
                    aria-label="Save Unchanged Data"
                    className="text-white inline-flex items-center justify-center rounded-md border
                     border-neutral-600/70 bg-neutral-700/40 hover:bg-neutral-600/50
                     active:bg-neutral-600/60 px-1.5 py-1"
                >
                    <ArrowPathIcon className="w-4 h-4"/>
                </button>}
                {skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 max-w-[90vw] pl-1">
                        {skills.map((skill) => (
                            <button
                                key={skill}
                                type="button"
                                title={skill}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenSkill(skill); }
                            }
                                className="inline-flex items-center whitespace-nowrap rounded-md border
                                 border-neutral-600/70 bg-neutral-700/40 hover:bg-neutral-600/50
                                  active:bg-neutral-600/60 px-1.5 py-0.5"
                                aria-haspopup="dialog"
                                aria-controls="skill-modal"
                            >
                                {skill}
                            </button>
                        ))}
                    </div>
                )}
                <div className="whitespace-nowrap rounded-md border border-neutral-600/70 bg-neutral-700/40
                 hover:bg-neutral-600/50 active:bg-neutral-600/60 px-1.5 py-0.5"
                     onClick={next} role="button" aria-label="Next card">
                    <span aria-label="Current card index">{selectedCardIndex + 1}</span>
                    <span className="opacity-70"> / </span>
                    <span aria-label="Total cards">{localCards.length}</span>
                </div>
                <button
                    type="button"
                    data-tour-id="download-card"
                    onClick={handleDownload}
                    title="Download this card as PNG"
                    aria-label="Download card image"
                    className="text-white inline-flex items-center justify-center rounded-md border
                     border-neutral-600/70 bg-neutral-700/40 hover:bg-neutral-600/50
                     active:bg-neutral-600/60 px-1.5 py-1"
                >
                    <ArrowDownTrayIcon className="w-4 h-4"/>
                </button>
            </div>

            {openSkill && (
                <div
                    id="skill-modal-backdrop"
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center px-3"
                    onClick={() => setOpenSkill(null)}
                    aria-hidden={false}
                >
                    <div
                        id="skill-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="skill-modal-title"
                        className="max-w-md w-full rounded-lg border border-neutral-600 bg-neutral-800 text-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-700">
                            <h3 id="skill-modal-title" className="text-base font-semibold">{openSkill}</h3>
                            <button
                                type="button"
                                className="rounded-md border border-neutral-600/70 bg-neutral-700/40
                                hover:bg-neutral-600/50 active:bg-neutral-600/60 px-2 py-0.5"
                                onClick={() => setOpenSkill(null)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="px-3 py-3 text-sm text-neutral-200">
                            <p>{skillData?.description}</p>
                            {skillData?.restrictions && <hr className={'mt-1'}/>}
                            <p className="mt-2 opacity-75">{skillData?.restrictions}</p>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="fixed left-0 right-0 bottom-0 z-20 px-2 pb-2"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto max-w-screen-md">
                    <textarea
                        data-tour-id="card-notes"
                        rows={3}
                        placeholder="Add player notes here"
                        value={(localCards[selectedCardIndex]?.playerData?.notes ?? '') as string}
                        onChange={(e) => {
                            const v = e.target.value;
                            setLocalCards(prev => prev.map((c, i) => {
                                if (i !== selectedCardIndex) return c;
                                return {
                                    ...c,
                                    playerData: {
                                        ...(c.playerData || {}),
                                        notes: v,
                                    }
                                };
                            }));
                        }}
                        className="w-full resize-none min-h-[64px] max-h-[40vh] px-2.5 py-2 rounded-t-md border
                        border-neutral-700 bg-neutral-900/90 text-white placeholder:text-neutral-500
                        focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 backdrop-blur"
                    />
                </div>
            </div>
        </section>
    );
}