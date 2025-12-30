import {base64UrlDecode} from "../utils/codec";
import {AnyPayload} from "../types";
import React, {useEffect, useMemo, useState} from "react";
import {loadSet} from "../services/backend";
import {mapToRuntime, parseQuery, useHashRoute} from "../utils/UseHashRoute";
import {CardsCarousel} from "./CardsCarousel";
import sample_cards from './sample_cards.json';


function DefaultViewer() {
    return <CardsCarousel cards={sample_cards}/>
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