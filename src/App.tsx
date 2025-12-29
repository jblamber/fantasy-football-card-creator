import React from "react";
import {CardCreator} from "./card/CardCreator";
import {CardViewer} from "./card/CardViewer";
import { ArrowDownTrayIcon, PencilSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import {useHashRoute, parseQuery} from "./utils/UseHashRoute";

export default function App() {
    const hash = useHashRoute();
    const [, routeAndQuery] = hash.split("#");
    const [route, queryString] = (routeAndQuery || "/viewer").split("?");
    const q = parseQuery(queryString || "");
    const hasActiveSet = (Boolean(q.d) || Boolean(q.s));

    const remixHref = hasActiveSet ? `#/create?${queryString || ''}` : '#/create';
    const remixLabel = hasActiveSet ? 'Remix' : 'Create';

    const viewHref = route === '/create' && (Boolean(q.d) || Boolean(q.s))
        ? `#/viewer?${queryString || ''}`
        : '#/viewer';

    return (
        <div className="min-h-screen">
            <nav
                className="fixed top-2 left-2 z-20 flex gap-2 rounded-md border border-neutral-700/80 bg-neutral-800/80 backdrop-blur px-1.5 py-1 shadow-md">
                <a
                    href="#"
                    className="text-white no-underline px-2.5 py-1.5 bg-neutral-800/80 title"
                >
                    MY HOLO CARD DECK
                    <div className="aurora">
                        <div className="aurora__item"></div>
                        <div className="aurora__item"></div>
                        <div className="aurora__item"></div>
                        <div className="aurora__item"></div>
                    </div>
                </a>
                <a
                    href={viewHref}
                    className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20"
                >
                    <MagnifyingGlassIcon className={"size-5 pt-1"}/>
                </a>
                <a
                    href={remixHref}
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
