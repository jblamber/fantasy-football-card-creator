import {base64UrlDecode} from "../utils/codec";
import {AnyPayload} from "../types";
import React, {useEffect, useMemo, useState} from "react";
import {loadSet} from "../services/backend";
import {mapToRuntime, parseQuery, useHashRoute} from "../utils/UseHashRoute";
import {CardsCarousel} from "./CardsCarousel";
import sample_cards from './sample_cards.json';
import { useTour } from "../tour/TourProvider";


function DefaultViewer() {
    return <CardsCarousel cards={sample_cards}/>
}

export function CardViewer() {
    const hash = useHashRoute();
    const [, routeAndQuery] = hash.split('#');
    const [route, queryString] = (routeAndQuery || '/viewer').split('?');
    const q = parseQuery(queryString || '');

    // Site tour is handled globally by TourProvider; if URL requests it, trigger viewer tour once.
    const { startViewerTour } = useTour();
    useEffect(() => {
        if (q.tour === 'preview' || q.tour === '1') {
            startViewerTour();
            try {
                const [, rq] = (window.location.hash || '#/viewer').split('#');
                const [r, qs] = (rq || '/viewer').split('?');
                const params = new URLSearchParams(qs || '');
                params.delete('tour');
                history.replaceState(null, '', `${window.location.pathname}#${r}?${params.toString()}`);
            } catch {}
        }
        // run only once on mount for current URL
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    let content: React.ReactNode = null;

    // support ?d= for base64 data
    if (q.d) {
        try {
            const payload = base64UrlDecode<AnyPayload>(q.d);
            if (payload && (payload as any).v === 1) {
                const cards = (payload as AnyPayload).cards.map(mapToRuntime);
                content = <CardsCarousel cards={cards}/>;
            }
        } catch (e) {
            // fallthrough to backend or default
            console.error(e);
        }
    }

    if (!content) {
        if (q.s) {
            if (!loaded) content = <div className="text-white p-4">Loading…</div>;
            else if (loaded.ok && loaded.cards) content = <CardsCarousel cards={loaded.cards}/>;
        }
    }

    if (!content) {
        content = <DefaultViewer/>;
    }

    return content;
}