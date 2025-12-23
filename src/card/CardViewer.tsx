import {base64UrlDecode} from "../utils/codec";
import {AnyPayload} from "../types";
import React, {useEffect, useMemo, useState} from "react";
import {loadSet} from "../services/backend";
import {mapToRuntime, parseQuery, useHashRoute} from "../utils/UseHashRoute";
import {CardsCarousel} from "./CardsCarousel";
import {CardRarity, PlayerType} from "./fantasyFootballCard/FantasyFootballCard";


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
        imagery: {
            imageProperties: {offsetX: -60, offsetY: 0, scalePercent: 150},
            lenticularUrls: {"0": "/img/players/grail1.png"}
        },
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
        imagery: {
            imageProperties: {offsetX: -50, offsetY: 0, scalePercent: 150},
            lenticularUrls: {"0": "/img/players/grail2.png"}
        },
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
        imagery: {
            imageProperties: {offsetX: 0, offsetY: 0, scalePercent: 150},
            lenticularUrls: {"0": "/img/players/thrower1.png"}
        },
        types: "water"
    }), []);

    return <CardsCarousel cards={[grailKnightA, grailKnightB, thrower1]}/>
}

export function CardViewer() {
    const hash = useHashRoute();
    const [, routeAndQuery] = hash.split('#');
    const [route, queryString] = (routeAndQuery || '/viewer').split('?');
    const q = parseQuery(queryString || '');

    // support ?s= shortcode via backend
    const [loaded, setLoaded] = useState<{ ok: boolean; cards?: any[] } | null>(null);
    useEffect(() => {
        let cancelled = false;

        async function run() {
            if (!q.s) {
                setLoaded({ok: false});
                return;
            }
            try {
                const {data} = await loadSet(q.s);
                const payload = base64UrlDecode<AnyPayload>(data);
                if (!cancelled && payload && (payload as any).v === 1) {
                    setLoaded({ok: true, cards: (payload as AnyPayload).cards.map(mapToRuntime)});
                }
            } catch (err) {
                if (!cancelled) setLoaded({ok: false});
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [q.s]);

    // support ?d= for base64 data
    if (q.d) {
        try {
            const payload = base64UrlDecode<AnyPayload>(q.d);
            if (payload && (payload as any).v === 1) {
                const cards = (payload as AnyPayload).cards.map(mapToRuntime);
                return <CardsCarousel cards={cards}/>
            }
        } catch (e) {
            // fallthrough to backend or default
            console.error(e);
        }
    }

    if (q.s) {
        if (!loaded) return <div className="text-white p-4">Loading…</div>;
        if (loaded.ok && loaded.cards) return <CardsCarousel cards={loaded.cards}/>;
    }

    return <DefaultViewer/>
}