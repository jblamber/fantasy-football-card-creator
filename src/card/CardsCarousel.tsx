import React, {useCallback, useState} from "react";
import FantasyFootballCard from "./fantasyFootballCard/FantasyFootballCard";

export function CardsCarousel({cards}: { cards: any[] }) {
    const [index, setIndex] = useState(0);
    const next = useCallback(() => setIndex(i => (i + 1) % cards.length), [cards.length]);
    const prev = useCallback(() => setIndex(i => (i - 1 + cards.length) % cards.length), [cards.length]);
    const onViewportClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 2) prev(); else next();
    }, [next, prev]);

    return (
        <section
            className="card-viewport h-screen flex p-1 justify-center [touch-action:manipulation]"
            onClick={onViewportClick}>
            {/* Sticky index indicator top-right */}
            <div
                className="fixed top-2 right-2 z-20 rounded-md border border-neutral-700/80 bg-neutral-800/80 backdrop-blur px-2.5 py-1 text-white text-sm shadow-md select-none"
                onClick={(e) => e.stopPropagation()}
            >
                <span aria-label="Current card index">{index + 1}</span>
                <span className="opacity-70"> / </span>
                <span aria-label="Total cards">{cards.length}</span>
            </div>

            <div onClick={(e) => e.stopPropagation()} style={{width: 'min(90vw, calc(90vh * 822 / 1122))'}}
                 className="aspect-[822/1122]">
                <FantasyFootballCard
                    {...cards[index]}
                    onSwipe={(dir) => {
                        if (dir === 'left') next(); else prev();
                    }}
                />
            </div>
        </section>
    );
}