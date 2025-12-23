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