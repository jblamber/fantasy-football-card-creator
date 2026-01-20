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

// Remove query string from current hash without reloading the page
export function stripHashQuery() {
    try {
        const hash = window.location.hash || '#/viewer';
        const [, rq] = hash.split('#');
        const [routeOnly] = (rq || '/viewer').split('?');
        const newHash = `#${routeOnly}`;
        const newUrl = `${window.location.pathname}${newHash}`;
        history.replaceState(null, '', newUrl);
        // Notify listeners that hash changed (some hooks rely on this)
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch {
        // ignore
    }
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