import {useEffect, useState} from "react";
import {FantasyFootballCardSerializable} from "../types";

export function useHashRoute() {
    const [hash, setHash] = useState<string>(window.location.hash || '#/viewer');
    useEffect(() => {
        const onHash = () => setHash(window.location.hash || '#/viewer');
        window.addEventListener('hashchange', onHash);
        if (!window.location.hash) window.location.hash = '#/viewer';
        return () => window.removeEventListener('hashchange', onHash);
    }, []);
    return hash;
}

export function parseQuery(search: string) {
    const params = new URLSearchParams(search);
    return Object.fromEntries(params.entries());
}

export function mapToRuntime(card: FantasyFootballCardSerializable) {
    return {
        ...card,
        imagery: {
            imageProperties: card.imagery.imageProperties,
            lenticularUrls: card.imagery.lenticularUrls
        }
    };
}