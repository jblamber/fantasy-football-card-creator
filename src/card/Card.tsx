import React, {useCallback, useEffect, useMemo, useRef} from "react";
import { useAppSettings } from "../appSettings/AppSettingsProvider";

/**
 * Trading Card
 * A self-contained React component that mimics the styling and interaction of the Svelte card component.
 *
 * Notes:
 * - This component focuses on the visual holographic/tilt interaction only.
 * - Styling is provided by the existing public CSS in this repo (e.g. /public/css/cards.css and /public/css/cards/base.css).
 *   Consumers should ensure those styles are available (in the example src, we link them in index.html).
 */

export type TradingCardProps = {
    children?: React.ReactNode;
    id?: string;
    name?: string;
    number?: string;
    set?: string;
    types?: string | string[];
    subtypes?: string | string[];
    supertype?: string;
    rarity?: string;
    isReverse?: boolean; // when true, rarity is treated as Reverse Holo for mask/foil computation

    // image props
    img?: string; // front image (full URL or relative to the hosting site)
    back?: string; // back image fallback
    foil?: string | boolean; // optional foil texture image URL; true/undefined -> auto, false -> none
    mask?: string | boolean; // optional mask image URL (defines where foil appears); true/undefined -> auto, false -> none

    // Optional: apply additional className
    className?: string;

    // Whether to enable a small idle showcase animation on mount
    showcase?: boolean;

    // Listener props for lenticular imagery
    onLenticularChange?: (x: number, y: number) => void;
    lenticularLength?: number;

    // Gesture callbacks
    onSwipe?: (direction: 'left' | 'right') => void;
};

function clamp(n: number, min = 0, max = 100) {
    return Math.max(min, Math.min(max, n));
}

function round(n: number, p = 0) {
    const f = Math.pow(10, p);
    return Math.round(n * f) / f;
}

function adjust(n: number, a: number, b: number, x: number, y: number) {
    // maps n in [a,b] to [x,y]
    if (b - a === 0) return x;
    return x + (n - a) * ((y - x) / (b - a));
}

export const TradingCard: React.FC<TradingCardProps> = ({
                                                            children,
                                                            id = '',
                                                            name = '',
                                                            number = '',
                                                            set: setName = '',
                                                            types = '',
                                                            subtypes = 'basic',
                                                            supertype = 'pokémon',
                                                            rarity = 'common',
                                                            isReverse = false,
                                                            img,
                                                            back = '/img/card/card_back.jpg',
                                                            foil,
                                                            mask,
                                                            className = '',
                                                            showcase = false,
                                                            onLenticularChange = () => {
                                                            },
                                                            lenticularLength = 0,
                                                            onSwipe,
                                                        }) => {
    const { powerSaving } = useAppSettings();
    const cardRef = useRef<HTMLDivElement | null>(null);
    const frontRef = useRef<HTMLDivElement | null>(null);
    const rotatorRef = useRef<HTMLButtonElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const showIntervalRef = useRef<number | null>(null);
    const showTimeoutRef = useRef<number | null>(null);
    const lenticularState = useRef<{ x: number, y: number }>({x: 0, y: 0})

    const rng = useMemo(() => ({x: Math.random(), y: Math.random()}), []);
    const cosmosPosition = useMemo(() => ({
        x: Math.floor(rng.x * 734),
        y: Math.floor(rng.y * 1280),
    }), [rng]);

    // State for animated values (spring-ish via raf + lerp)
    const target = useRef({
        bgx: 50,
        bgy: 50,
        rx: 0,
        ry: 0,
        gx: 50,
        gy: 50,
        go: 0,
    });
    const current = useRef({...target.current});

    // small helper to update CSS variables on the card element
    const applyVars = () => {
        const el = cardRef.current as HTMLElement | null;
        if (!el) return;

        const fromCenter = clamp(Math.sqrt(
            (current.current.gy - 50) * (current.current.gy - 50) +
            (current.current.gx - 50) * (current.current.gx - 50)
        ) / 50, 0, 1);

        el.style.setProperty('--pointer-x', `${current.current.gx}%`);
        el.style.setProperty('--pointer-y', `${current.current.gy}%`);
        el.style.setProperty('--pointer-from-center', `${fromCenter}`);
        el.style.setProperty('--pointer-from-top', `${current.current.gy / 100}`);
        el.style.setProperty('--pointer-from-left', `${current.current.gx / 100}`);
        el.style.setProperty('--card-opacity', `${current.current.go}`);
        el.style.setProperty('--rotate-x', `${current.current.rx}deg`);
        el.style.setProperty('--rotate-y', `${current.current.ry}deg`);
        el.style.setProperty('--background-x', `${current.current.bgx}%`);
        el.style.setProperty('--background-y', `${current.current.bgy}%`);
    };

    const tick = () => {
        // If power-saving is enabled, do not animate or schedule frames
        if (powerSaving) {
            rafRef.current = null;
            return;
        }
        const s = 0.05; // smoothing for spring-like behavior (0..1) closer to 0, more smooth.
        const c = current.current;
        const t = target.current;
        const threshold = 0.001; // minimum delta to continue animation

        // Check if all values are close enough to target
        const isSettled =
            Math.abs(t.bgx - c.bgx) < threshold &&
            Math.abs(t.bgy - c.bgy) < threshold &&
            Math.abs(t.rx - c.rx) < threshold &&
            Math.abs(t.ry - c.ry) < threshold &&
            Math.abs(t.gx - c.gx) < threshold &&
            Math.abs(t.gy - c.gy) < threshold &&
            Math.abs(t.go - c.go) < threshold;

        c.bgx += (t.bgx - c.bgx) * s;
        c.bgy += (t.bgy - c.bgy) * s;
        c.rx += (t.rx - c.rx) * s;
        c.ry += (t.ry - c.ry) * s;
        c.gx += (t.gx - c.gx) * s;
        c.gy += (t.gy - c.gy) * s;
        c.go += (t.go - c.go) * s;

        const rx = current.current.rx;
        const maxLenticular = (lenticularLength - 1) / 2
        const lenticularX = rx >= 0 ? Math.round(Math.min(14, rx) / 14 * maxLenticular) :
            Math.round(Math.max(-14, rx) / 14 * maxLenticular);
        if (lenticularState.current.x != lenticularX) {
            onLenticularChange(-lenticularX, lenticularState.current.y);
        }
        lenticularState.current.x = lenticularX;

        applyVars();
        if (!isSettled) {
            rafRef.current = requestAnimationFrame(tick);
        } else {
            rafRef.current = null;
        }
    };

    useEffect(() => {
        if (!powerSaving) {
            rafRef.current = requestAnimationFrame(tick);
        }
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (showIntervalRef.current) window.clearInterval(showIntervalRef.current);
            if (showTimeoutRef.current) window.clearTimeout(showTimeoutRef.current as unknown as number);
            rafRef.current = null;
        };
    }, [powerSaving]);

    // When power-saving toggles on, immediately stop and reset animated values
    useEffect(() => {
        if (!powerSaving) return;
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (showIntervalRef.current) {
            window.clearInterval(showIntervalRef.current);
            showIntervalRef.current = null;
        }
        if (showTimeoutRef.current) {
            window.clearTimeout(showTimeoutRef.current as unknown as number);
            showTimeoutRef.current = null;
        }
        // Reset target and current to neutral and apply CSS vars once
        target.current.rx = 0;
        target.current.ry = 0;
        target.current.gx = 50;
        target.current.gy = 50;
        target.current.go = 0;
        target.current.bgx = 50;
        target.current.bgy = 50;
        current.current = { ...target.current };
        applyVars();
    }, [powerSaving]);

    useEffect(() => {
        // showcase idle animation like Svelte version (subtle sine-wave motion)
        if (!showcase || powerSaving) return;
        // wait 2s to start
        showTimeoutRef.current = window.setTimeout(() => {
            let r = 0;
            showIntervalRef.current = window.setInterval(() => {
                r += 0.05;
                target.current.rx = Math.sin(r) * 25;
                target.current.ry = Math.cos(r) * 25;
                target.current.gx = 55 + Math.sin(r) * 55;
                target.current.gy = 55 + Math.cos(r) * 55;
                target.current.go = 0.8;
                target.current.bgx = 20 + Math.sin(r) * 20;
                target.current.bgy = 20 + Math.cos(r) * 20;
            }, 20);
            // end after ~4s and reset
            window.setTimeout(() => {
                if (showIntervalRef.current) {
                    window.clearInterval(showIntervalRef.current);
                    showIntervalRef.current = null;
                }
                resetInteraction(0);
            }, 4000);
        }, 2000);
        return () => {
            if (showIntervalRef.current) {
                window.clearInterval(showIntervalRef.current);
                showIntervalRef.current = null;
            }
            if (showTimeoutRef.current) {
                window.clearTimeout(showTimeoutRef.current as unknown as number);
                showTimeoutRef.current = null;
            }
        };
    }, [showcase, powerSaving]);

    const setStaticSeeds = () => {
        const el = cardRef.current as HTMLElement | null;
        if (!el) return;
        el.style.setProperty('--seedx', String(rng.x));
        el.style.setProperty('--seedy', String(rng.y));
        el.style.setProperty('--cosmosbg', `${cosmosPosition.x}px ${cosmosPosition.y}px`);
    };

    useEffect(() => {
        setStaticSeeds();
    }, [rng, cosmosPosition]);

    // Update foil/mask CSS variables on the front container when they change
    useEffect(() => {
        const front = frontRef.current as HTMLElement | null;
        if (!front) return;
        if (mask) {
            //front.style.setProperty('--mask', `url(${resolvedMask})`);
        } else {
            front.style.removeProperty('--mask');
        }
        if (foil) {
            //front.style.setProperty('--foil', `url(${resolvedFoil})`);
        } else {
            front.style.removeProperty('--foil');
        }
    }, [foil, mask]);

    const swipeRef = useRef<{ x: number; y: number; t: number } | null>(null);

    const onPointerMove: React.PointerEventHandler = (e) => {
        if (powerSaving) return; // disable interaction updates in power-saving mode
        const rot = rotatorRef.current;
        if (!rot) return;

        const rect = rot.getBoundingClientRect();
        const abs = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        const percent = {
            x: clamp(round((100 / rect.width) * abs.x)),
            y: clamp(round((100 / rect.height) * abs.y)),
        };
        const center = {
            x: percent.x - 50,
            y: percent.y - 50,
        };

        //Update animation values and request animation frame
        target.current.bgx = adjust(percent.x, 0, 100, 37, 63);
        target.current.bgy = adjust(percent.y, 0, 100, 33, 67);
        target.current.rx = round(-(center.x / 3.5));
        target.current.ry = round(center.y / 2);
        target.current.gx = round(percent.x);
        target.current.gy = round(percent.y);
        target.current.go = 1;

        if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(tick);
        }
    };

    const resetInteraction = useCallback((delay = 500) => {
        window.setTimeout(() => {
            // snap back values
            target.current.rx = 0;
            target.current.ry = 0;
            target.current.gx = 50;
            target.current.gy = 50;
            target.current.go = 0;
            target.current.bgx = 50;
            target.current.bgy = 50;
        }, delay);
        //onLenticularChange(0, 0);
    }, [onLenticularChange]);

    const onPointerLeave: React.PointerEventHandler = () => {
        resetInteraction(200);
    };

    const onBlur: React.FocusEventHandler = () => {
        resetInteraction(0);
    };

    // Normalize types/subtypes for CSS classes/data attributes
    const typesStr = Array.isArray(types) ? types.join(' ').toLowerCase() : String(types).toLowerCase();
    const subtypesStr = Array.isArray(subtypes) ? subtypes.join(' ').toLowerCase() : String(subtypes).toLowerCase();
    const rarityStr = String(rarity).toLowerCase();
    const supertypeStr = String(supertype).toLowerCase();

    return (
        <div
            className={`card ${typesStr} interactive ${mask ? 'masked' : ''} ${foil ? 'foil' : ''} ${className || ''}`}
            data-number={(number || '').toLowerCase()}
            data-set={(setName || '').toLowerCase()}
            data-subtypes={subtypesStr}
            data-supertype={supertypeStr}
            data-rarity={rarityStr}
            ref={cardRef}
            style={{width: '100%', height: '100%'}}
        >
            <div className="card__translater">
                <button
                    className="card__rotator"
                    aria-label={`Trading Card; ${name || 'Unknown'}.`}
                    tabIndex={0}
                    ref={rotatorRef}
                    style={{touchAction: 'none', width: '100%', height: '100%'}}
                    onPointerDown={(e) => {
                        const targetEl = e.currentTarget;
                        try {
                            targetEl.setPointerCapture?.(e.pointerId);
                        } catch {
                        }
                        // record swipe start
                        swipeRef.current = {x: e.clientX, y: e.clientY, t: Date.now()};
                        onPointerMove(e);
                    }}
                    onPointerMove={onPointerMove}
                    onPointerUp={(e) => {
                        try {
                            e.currentTarget.releasePointerCapture?.(e.pointerId);
                        } catch {
                        }
                        const start = swipeRef.current;
                        const rot = rotatorRef.current;
                        if (start && rot) {
                            const dt = Date.now() - start.t;
                            const dx = e.clientX - start.x;
                            const dy = e.clientY - start.y;
                            const rect = rot.getBoundingClientRect();
                            const threshold = Math.max(40, rect.width * 0.12);
                            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= threshold && dt < 800) {
                                if (dx < 0) {
                                    onSwipe?.('left');
                                } else {
                                    onSwipe?.('right');
                                }
                            }
                        }
                        swipeRef.current = null;
                        resetInteraction(200);
                    }}
                    onPointerCancel={(e) => {
                        try {
                            e.currentTarget.releasePointerCapture?.(e.pointerId);
                        } catch {
                        }
                        resetInteraction(200);
                    }}
                    onPointerLeave={onPointerLeave}
                    onBlur={onBlur}
                >
                    <img
                        className="card__back"
                        src={back}
                        alt={`The back of the ${name || 'Trading'} Card Card`}
                        width={822}
                        height={1122}
                        style={{width: '100%', height: 'auto', display: 'block'}}
                    />
                    <div className="card__front" ref={frontRef}>
                        {img ? (<img
                            src={img}
                            alt={`Front design of the ${name || 'Trading'} Card, with the stats and info around the edge`}
                            width={822}
                            height={1122}
                        />) : children}
                        <div className="card__info">
                            <span className="card__name"></span>
                        </div>
                        <div className="card__shine"></div>
                        <div className="card__glare"></div>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default TradingCard;
