import {base64UrlDecode, base64UrlEncode} from "../utils/codec";
import {FFCGDeckPayload, Deck, FantasyFootballCardSerializable} from "../types";
import React, {Dispatch, SetStateAction, useEffect, useMemo, useState} from "react";
import {mapToRuntime, parseQuery, stripHashQuery, useHashRoute} from "../utils/UseHashRoute";
import {CardsCarousel} from "./CardsCarousel";
import CardsFanView from './CardsFan';
import sample_cards from './sample_cards.json';
import { useTour } from "../tour/TourProvider";
import {listDecks, saveDeckLs} from "../localStorage/localDecks";

const sampleDeck = {
    cards: sample_cards,
    id: null,
    name: "Sample Deck",
    v: 1
} as Deck;

interface DeckViewerProps {
    deck: Deck | undefined;
    setCurrentDeck: Dispatch<SetStateAction<Deck | undefined>>
}

export function DeckViewer({deck, setCurrentDeck}: DeckViewerProps) {
    const hash = useHashRoute();
    const [, routeAndQuery] = hash.split('#');
    const [route, queryString] = (routeAndQuery || '/viewer').split('?');
    const q = parseQuery(queryString || '');

    // Backward-compat importer: if a legacy q payload is present, save deck to localStorage and clean URL
    useEffect(() => {
        const qstr = q.q || q.d as string | undefined;
        if (!qstr) return;
        try {
            const payload = base64UrlDecode<FFCGDeckPayload>(qstr);
            if ((payload as any)?.v === 1) {

                const ds = listDecks()

                const matching = ds.find(d => d.cards.length === payload.cards.length &&
                    payload.cards?.[0]?.playerData?.teamName &&
                    payload.cards?.[0]?.playerData?.teamName === d.cards?.[0]?.playerData?.teamName);

                if (matching) {
                    setCurrentDeck(matching);
                    return;
                } else {
                    const legacyDeck = {
                        cards:  payload.cards,
                        id: "legacy_" + Date.now().toString(36),
                        name: payload.cards[0].playerData.teamName || "Legacy Deck",
                        v: 1,
                    } as Deck

                    setCurrentDeck(legacyDeck)
                }

            }
        } catch {
            // ignore invalid
        } finally {
            stripHashQuery();
        }
        // run once for initial mount url
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // support ?s= shortcode via backend later
    const [loaded, setLoaded] = useState<{ ok: boolean; cards?: any[] } | null>(null);


    const initialIndex = Number.isFinite(Number(q.i)) ? Math.max(0, Number(q.i)) : 0;
    const mode = (q.mode || '').toString();

    const openCarouselAt = (i: number) => {
        const params = new URLSearchParams();
        params.set('i', String(i));
        window.location.hash = `#/viewer?${params.toString()}`;
    };


    if (!deck) {
        if (mode === 'fan') {
            return <CardsFanView deck={sampleDeck} initialIndex={initialIndex} onOpenCarousel={openCarouselAt}/>;
        }
        return <CardsCarousel setCurrentDeck={setCurrentDeck} deck={sampleDeck} initialIndex={initialIndex}/>;
    }
    else {
        if (mode === 'fan') {
            return <CardsFanView deck={deck} initialIndex={initialIndex} onOpenCarousel={openCarouselAt}/>;
        }
        return <CardsCarousel setCurrentDeck={setCurrentDeck} deck={deck} initialIndex={initialIndex}></CardsCarousel>
    }
}