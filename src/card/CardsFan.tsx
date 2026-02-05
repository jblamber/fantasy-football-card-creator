import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Deck, FantasyFootballCardSerializable} from "../types";
import {useAppSettings} from "../appSettings/AppSettingsProvider";
import FantasyFootballCard from "./fantasyFootballCard/FantasyFootballCard";

interface CardsFanProps {
    deck: Deck;
    className?: string;
    initialIndex?: number;
    onOpenCarousel?: (index: number) => void;
}

export default function CardsFanView({deck, className, initialIndex = 0, onOpenCarousel}: CardsFanProps) {
    const cards = deck.cards as FantasyFootballCardSerializable[];

    const [frontIndex, setFrontIndex] = useState<number>(Math.max(0, Math.min(cards.length - 1, initialIndex)));
    useEffect(() => {
        setFrontIndex(Math.max(0, Math.min(cards.length - 1, initialIndex)));
    }, [initialIndex, deck?.id, cards.length]);

    // Angle distribution across 30 degrees
    const totalArc = 55; // degrees
    const halfArc = totalArc / 2;
    const [angleOffset, setAngleOffset] = useState<number>(0); // live rotation offset from pointer

    const containerRef = useRef<HTMLDivElement | null>(null);
    const rAF = useRef<number | null>(null);

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

    const angles = useMemo(() => {
        const n = cards.length || 1;
        if (n === 1) return [0 + angleOffset];
        const step = totalArc / (n - 1);
        const baseStart = -halfArc;
        return new Array(n).fill(0).map((_, i) => baseStart + i * step + angleOffset);
    }, [cards.length, angleOffset]);

    // Derived z-index placing the `frontIndex` on top, others decreasing by distance
    const zFor = useCallback((i: number) => {
        if (i === frontIndex) return 1200;
        const d = Math.abs(i - frontIndex);
        return 1000 - d; // large base to ensure ordering
    }, [frontIndex]);

    // Double-click / double-tap
    const lastTapRef = useRef<number>(0);
    const onCardActivate = useCallback((i: number) => {
        if (onOpenCarousel) onOpenCarousel(i);
        else {
            // default: update hash to viewer
            const params = new URLSearchParams();
            params.set('i', String(i));
            window.location.hash = `#/viewer?${params.toString()}`;
        }
    }, [onOpenCarousel]);

    const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowRight') setFrontIndex(i => (i + 1) % cards.length);
        if (e.key === 'ArrowLeft') setFrontIndex(i => (i - 1 + cards.length) % cards.length);
        if (e.key === 'Enter' || e.key === ' ') onCardActivate(frontIndex);
    }, [cards.length, onCardActivate, frontIndex]);

    const widthStyle = { width: 'min(92vw, calc(92vh * 822 / 1122))' } as React.CSSProperties;

    return (
        <section className={`card-viewport h-screen flex p-1 justify-center [touch-action:manipulation] ${className || ''}`}
                 onKeyDown={onKeyDown}
        >
            <div ref={containerRef}
                 className="relative select-none"
                 style={{ ...widthStyle, aspectRatio: '822 / 1122', perspective: 1200 }}
                 role="list"
                 aria-label="Cards fan view"
                 tabIndex={0}
            >
                {cards.map((card, i) => {
                    const angle = angles[i] || 0;
                    // translate outward a bit based on angle for a spread look
                    const radius = 50; // dvh
                    let tx = Math.sin(angle * Math.PI / 180) * radius;
                    let ty = Math.abs(Math.cos(angle * Math.PI / 180)) + 0; // small lift
                    const isFront = i === frontIndex;
                    if (isFront) {
                        ty -= 5;
                    }
                    if (isFront) {
                        tx += 1;
                    }
                    return (
                        <div
                            key={i}
                            role="listitem"
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                                zIndex: zFor(i),
                                pointerEvents: 'auto',

                            }}
                            onDoubleClick={() => onCardActivate(i)}
                        >
                            <div
                                className={`transition-transform duration-1000 ease-in-out transform-gpu`}
                                style={{
                                    width: '45dvw',
                                    transform: `translate3d(${tx}dvw, ${ty}dvh, ${zFor(i)}px) rotate(${angle}deg) ${isFront ? '' : 'scale(0.98)'}`,
                                }}
                            >
                                <FantasyFootballCard
                                    {...card}
                                    onSwipe={(dir) => {
                                        setFrontIndex(idx => dir === 'left' ? (idx + 1) % cards.length : (idx - 1 + cards.length) % cards.length);
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}