import React, {useEffect, useMemo, useState} from "react";
import {CardCreator} from "./card/CardCreator";
import {CardViewer} from "./card/CardViewer";
import { PencilSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import {useHashRoute, parseQuery} from "./utils/UseHashRoute";
import {getCurrentDeckId, getDeck, listDecks, LocalDeck, setCurrentDeckId} from "./services/localDecks";
import {ToastContainer} from "react-toastify";

export default function App() {
    const hash = useHashRoute();
    const [, routeAndQuery] = hash.split("#");
    const [route, queryString] = (routeAndQuery || "/viewer").split("?");
    const q = parseQuery(queryString || "");
    const hasActiveSet = (Boolean(q.d) || Boolean(q.s));

    const remixHref = hasActiveSet ? `#/create?${queryString || ''}` : '#/create';

    const viewHref = route === '/create' && (Boolean(q.d) || Boolean(q.s))
        ? `#/viewer?${queryString || ''}`
        : '#/viewer';

    // Local decks state for nav select when on /create
    const [decks, setDecks] = useState<LocalDeck[]>([]);
    const [currentId, setCurrentId] = useState<string | null>(null);

    const currentDeck = useMemo(() => decks.find(d => d.id === currentId), [decks, currentId]);

    useEffect(() => {
        // initial load
        const refresh = () => {
            setDecks(listDecks());
            setCurrentId(getCurrentDeckId());
        };
        refresh();
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'ffcg.decks' || e.key === 'ffcg.currentDeckId') {
                refresh();
            }
        };
        const onCustom = () => refresh();
        window.addEventListener('storage', onStorage);
        window.addEventListener('ffcg:decks-changed', onCustom as any);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('ffcg:decks-changed', onCustom as any);
        };
    }, []);

    const onSelectDeck = (id: string) => {
        const deck = getDeck(id);
        setCurrentDeckId(deck?.id || null);
        setCurrentId(deck?.id || null);
        if (route === '/create') {
            // Navigate to creator with deck data
            const newHash = deck ? `#/create?d=${deck.data}` : '#/create';
            history.replaceState(null, '', `${window.location.pathname}${newHash}`);
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        } else {
            // go to creator with the selected deck
            const newHash = deck ? `#/viewer?d=${deck.data}` : '#/create';
            history.replaceState(null, '', `${window.location.pathname}${newHash}`);
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
    };

    return (
        <div className="min-h-screen">
            <ToastContainer theme={'dark'} />
            <nav
                className="fixed top-2 left-2 z-20 flex gap-2 rounded-md border border-neutral-700/80 bg-neutral-800/80 backdrop-blur px-1.5 py-1 shadow-md">

                <div className="px-2.5 py-1.5 bg-neutral-800/80 rounded-md text-white title">
                    <label className="sr-only" htmlFor="deck-select">Current deck</label>
                    <select
                        id="deck-select"
                        className="bg-transparent text-white focus:outline-none"
                        value={currentId ?? ''}
                        onChange={(e) => onSelectDeck(e.target.value)}
                    >
                        <option value="">(Unsaved deck)</option>
                        {decks.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                    <div className="aurora">
                        <div className="aurora__item"></div>
                        <div className="aurora__item"></div>
                        <div className="aurora__item"></div>
                        <div className="aurora__item"></div>
                    </div>
                </div>

                <a
                    href={viewHref}
                    className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20"
                >
                    <MagnifyingGlassIcon className={"size-5 pt-1"}/>
                </a>
                <a
                    href={hasActiveSet ? `#/create?${queryString || ''}` : '#/create'}
                    className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20"
                >
                   <PencilSquareIcon className="size-5 pt-1"/>
                </a>
                <a
                    href="https://github.com/jblamber/fantasy-football-card-creator"
                    className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20"
                >
                    ?
                </a>
            </nav>
            <div className="pt-12 max-w-[900px] mx-auto">
                {route === "/create" ? <CardCreator/> : <CardViewer/>}
            </div>
        </div>
    );
}
