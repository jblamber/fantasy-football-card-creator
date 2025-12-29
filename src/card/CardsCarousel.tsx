import React, {useCallback, useRef, useState} from "react";
import FantasyFootballCard from "./fantasyFootballCard/FantasyFootballCard";
import {ArrowDownTrayIcon} from "@heroicons/react/24/solid";

export function CardsCarousel({cards}: { cards: any[] }) {
    const [index, setIndex] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const next = useCallback(() => setIndex(i => (i + 1) % cards.length), [cards.length]);
    const prev = useCallback(() => setIndex(i => (i - 1 + cards.length) % cards.length), [cards.length]);
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
        const card = cards[index] || {};
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
    }, [cards, index]);

    return (
        <section
            className="card-viewport h-screen flex p-1 justify-center [touch-action:manipulation]"
            onClick={onViewportClick}>
            {/* Sticky controls top-right */}
            <div
                className="fixed top-2 right-2 z-20 rounded-md border border-neutral-700/80 bg-neutral-800/80 backdrop-blur px-2.5 py-1 text-white text-sm shadow-md select-none flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="whitespace-nowrap">
                    <span aria-label="Current card index">{index + 1}</span>
                    <span className="opacity-70"> / </span>
                    <span aria-label="Total cards">{cards.length}</span>
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

            <div onClick={(e) => e.stopPropagation()} style={{width: 'min(90vw, calc(90vh * 822 / 1122))'}}
                 className="aspect-[822/1122]">
                <FantasyFootballCard
                    {...cards[index]}
                    onSwipe={(dir) => {
                        if (dir === 'left') next(); else prev();
                    }}
                    canvasRef={canvasRef}
                />
            </div>
        </section>
    );
}