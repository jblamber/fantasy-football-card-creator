import {ToastContainer} from "react-toastify";
import {DeckCreator} from "./card/DeckCreator";
import {DeckViewer} from "./card/DeckViewer";
import React, {useEffect, useState} from "react";
import {parseQuery, stripHashQuery, useHashRoute} from "./utils/UseHashRoute";
import {listDecks, saveDeck, saveDeckLs} from "./services/localDecks";
import {CardAppNavigation} from "./CardAppNavigation";
import {FFCGDeckPayload, Deck} from "./types";
import {base64UrlDecode} from "./utils/codec";


export default function CardApp() {

    const hash = useHashRoute();
    const [, routeAndQuery] = hash.split("#");
    const [route, queryString] = (routeAndQuery || "/viewer").split("?");
    const q = parseQuery(queryString || '');

    // Local decks state for nav select when on /create
    const [decks, setDecks] = useState<Deck[]>([]);
    const [deck, setCurrentDeck] = useState<Deck | undefined>(undefined);


    useEffect(() => {
        // initial load
        const lsDecks = listDecks();
        setDecks(lsDecks);

        const qstr = q.q || q.d as string | undefined;
        if (qstr) {
            try {
                const payload = base64UrlDecode<FFCGDeckPayload>(qstr);
                if ((payload as any)?.v === 1) {
                    const matching = lsDecks.find(d => d.cards.length === payload.cards.length &&
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
                        saveDeck(legacyDeck);
                        setCurrentDeck(legacyDeck)
                    }
                }
            } catch {
                // ignore invalid
            } finally {
                stripHashQuery();
            }
        } else {
            setCurrentDeck(lsDecks?.[0] || undefined);
        }

    }, []);


    useEffect(() => {
        const refresh = () => {
            const lsDecks = listDecks();
            setDecks(lsDecks);
            const shown = lsDecks.find(d => d.id === deck?.id)
            if (shown) {
                setCurrentDeck(shown);
            }
        };
        const onCustom = () => refresh();
        window.addEventListener('ffcg:decks-changed', onCustom as any);
        return () => {
            window.removeEventListener('ffcg:decks-changed', onCustom as any);
        };
    }, []);


  return (
    <div className="min-h-screen">
        <ToastContainer theme={'dark'} />
        <CardAppNavigation deck={deck} setCurrentDeck={setCurrentDeck} decks={decks}/>
        <div className="pt-12 max-w-[900px] mx-auto">
            {route === "/create" ? <DeckCreator deck={deck} setCurrentDeck={setCurrentDeck}/> :
                <DeckViewer deck={deck} setCurrentDeck={setCurrentDeck} />}
        </div>
    </div>
  )
}