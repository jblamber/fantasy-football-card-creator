import React from "react";
import {CardCreator} from "./card/CardCreator";
import {CardViewer} from "./card/CardViewer";
import {useHashRoute} from "./utils/UseHashRoute";

export default function App() {
    const hash = useHashRoute();
    const [, routeAndQuery] = hash.split("#");
    const [route] = (routeAndQuery || "/viewer").split("?");

    return (
        <div className="min-h-screen">
            <nav
                className="fixed top-2 left-2 z-20 flex gap-2 rounded-md border border-neutral-700/80 bg-neutral-800/80 backdrop-blur px-1.5 py-1 shadow-md">
                <a
                    href="#"
                    className="text-white no-underline px-2.5 py-1.5 bg-neutral-800/80 title"
                >
                    HOLO-BUILDER
                    <div className="aurora">
                        <div className="aurora__item"></div>
                        <div className="aurora__item"></div>
                        <div className="aurora__item"></div>
                        <div className="aurora__item"></div>
                    </div>
                </a>
                <a
                    href="#/viewer"
                    className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20"
                >
                    View
                </a>
                <a
                    href="#/create"
                    className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20"
                >
                    Create
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
