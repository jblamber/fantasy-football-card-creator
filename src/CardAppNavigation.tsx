import {CodeBracketIcon, PlayIcon, QuestionMarkCircleIcon} from "@heroicons/react/16/solid";
import {PencilSquareIcon} from "@heroicons/react/24/solid";
import React from "react";
import {getDeck, setCurrentDeckId} from "./services/localDecks";
import {useTour} from "./tour/TourProvider";
import {parseQuery, useHashRoute} from "./utils/UseHashRoute";

export interface CardAppNavigationProps {
    currentId: string | null;
    setCurrentId: (id: string | null) => void;
    decks: { id: string, name: string }[];
}

export const CardAppNavigation = ({setCurrentId, currentId, decks}: CardAppNavigationProps) => {


    const hash = useHashRoute();
    const [, routeAndQuery] = hash.split("#");
    const [route, queryString] = (routeAndQuery || "/viewer").split("?");
    const q = parseQuery(queryString || "");
    const { startTourForRoute } = useTour();
    const hasActiveSet = (Boolean(q.d) || Boolean(q.s));

    const viewHref = route === '/create' && (Boolean(q.d) || Boolean(q.s))
        ? `#/viewer?${queryString || ''}`
        : '#/viewer';

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

    function StartTourBtn() {
        return (
            <a
                id={'start-tour'}
                onClick={() => startTourForRoute(route)}
                className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20"
                title="Start Site Tour"
            >
                <QuestionMarkCircleIcon className="size-5 pt-1"/>
            </a>
        );
    }

    function SourceBtn() {
        return (
            <a
                id={'source-link'}
                href="https://github.com/jblamber/fantasy-football-card-creator"
                className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20"
            >
                <CodeBracketIcon   className="size-5 pt-1"/>
            </a>
        )
    }

    function EditBtn() {
        return (
            <a
                id={"editor-link"}
                href={hasActiveSet ? `#/create?${queryString || ''}` : '#/create'}
                className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20"
            >
                <PencilSquareIcon className="size-5 pt-1"/>
            </a>
        )
    }

    function ViewerBtn() {
        return (
            <a
                id={"viewer-link"}
                href={viewHref}
                className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20"
            >
                <PlayIcon className={"size-5 pt-1"}/>
            </a>
        )
    }

    return (
        <nav
            className="fixed top-2 left-2 z-20 flex gap-2 rounded-md border border-neutral-700/80 bg-neutral-800/80 backdrop-blur px-1.5 py-1 shadow-md">

            <div className="px-2.5 py-1.5 bg-neutral-800/80 rounded-md text-white title">
                <label className="sr-only" htmlFor="deck-select">Current deck</label>
                <select
                    id="deck-select"
                    className="bg-transparent text-white focus:outline-none"
                    value={currentId ?? 'Sample Deck'}
                    onChange={(e) => onSelectDeck(e.target.value)}
                >
                    <option value="">Sample Deck</option>
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

            <ViewerBtn/>
            <EditBtn/>
            <SourceBtn/>
            <StartTourBtn />
        </nav>
    )
}