import {
    PencilSquareIcon,
    CodeBracketIcon,
    PlayIcon,
    QuestionMarkCircleIcon,
    BoltIcon, BoltSlashIcon,
    Bars3Icon, XMarkIcon
} from "@heroicons/react/16/solid";
import React, { useEffect, useRef, useState } from "react";
import {getDeck, setCurrentDeckId} from "./services/localDecks";
import {useTour} from "./tour/TourProvider";
import {parseQuery, useHashRoute} from "./utils/UseHashRoute";
import { useAppSettings } from "./appSettings/AppSettingsProvider";
import {DeviceMoveIcon} from "./buttons/device-move";

export interface CardAppNavigationProps {
    currentId: string | null;
    setCurrentId: (id: string | null) => void;
    decks: { id: string, name: string }[];
}

export const CardAppNavigation = ({setCurrentId, currentId, decks}: CardAppNavigationProps) => {

    const { powerSaving, togglePowerSaving, tiltMode, toggleTiltMode } = useAppSettings();
    const hash = useHashRoute();
    const [, routeAndQuery] = hash.split("#");
    const [route, queryString] = (routeAndQuery || "/viewer").split("?");
    const q = parseQuery(queryString || "");
    const { startTourForRoute } = useTour();
    const hasActiveSet = (Boolean(q.d) || Boolean(q.s));

    const viewHref = route === '/create' && (Boolean(q.d) || Boolean(q.s))
        ? `#/viewer?${queryString || ''}`
        : '#/viewer';

    // Mobile menu state
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!menuOpen) return;
        // Focus first focusable element in the menu on open
        const first = menuRef.current?.querySelector('button, a') as HTMLElement | null;
        first?.focus();
    }, [menuOpen]);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (!menuOpen) return;
            const t = e.target as Node;
            if (menuRef.current && !menuRef.current.contains(t) && triggerRef.current && !triggerRef.current.contains(t)) {
                setMenuOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        window.addEventListener('mousedown', onClick);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('mousedown', onClick);
            window.removeEventListener('keydown', onKey);
        };
    }, [menuOpen]);

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

    function PowerSavingBtn() {
        return (
            <button
                id={"power-saving-mode"}
                onClick={togglePowerSaving}
                aria-pressed={powerSaving}
                data-tour-id="power-saving-mode"
                title={powerSaving ? 'Power Saving: ON' : 'Power Saving: OFF'}
                className={`text-white no-underline px-2.5 py-1.5 rounded-md transition-colors ${powerSaving ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-white/10 hover:bg-white/20'}`}
            >
                {powerSaving && (<BoltSlashIcon className="size-5"/>)}
                {!powerSaving && (<BoltIcon className="size-5"/>)}
            </button>
        )
    }

    function TiltModeBtn() {
        const { tiltMode, toggleTiltMode } = useAppSettings();
        return (
            <button
                id={"tilt-mode"}
                onClick={toggleTiltMode}
                aria-pressed={tiltMode}
                title={tiltMode ? 'Device Tilt: ON' : 'Device Tilt: OFF'}
                className={`md:hidden text-white no-underline px-2.5 py-1.5 rounded-md transition-colors ${tiltMode ? 'bg-sky-700 hover:bg-sky-600' : 'bg-white/10 hover:bg-white/20'}`}
            >
                <DeviceMoveIcon className="size-5" />
            </button>
        );
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

    function MobileMenu() {
        return <>
            <button
                ref={triggerRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="md:hidden text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20"
                onClick={() => setMenuOpen(o => !o)}
                title="Menu"
            >
                {menuOpen ? <XMarkIcon className="size-5"/> : <Bars3Icon className="size-5"/>}
            </button>

            {/* Mobile dropdown menu */}
            {menuOpen && (
                <div
                    ref={menuRef}
                    role="menu"
                    aria-label="Navigation menu"
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 rounded-md border border-neutral-700/80 bg-neutral-800/95 backdrop-blur shadow-lg p-2 flex flex-col gap-2 md:hidden"
                >
                    <a id={"viewer-link-mobile"} href={viewHref} role="menuitem" onClick={() => setMenuOpen(false)}
                       className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20 flex items-center gap-2">
                        <PlayIcon className="size-5"/> <span>Viewer</span>
                    </a>
                    <a id={"editor-link-mobile"} href={hasActiveSet ? `#/create?${queryString || ''}` : '#/create'}
                       role="menuitem" onClick={() => setMenuOpen(false)}
                       className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20 flex items-center gap-2">
                        <PencilSquareIcon className="size-5"/> <span>Edit</span>
                    </a>
                    <button id={"power-saving-mode-mobile"} role="menuitem" onClick={() => {
                        togglePowerSaving();
                        setMenuOpen(false);
                    }}
                            aria-pressed={powerSaving}
                            className={`text-white no-underline px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-2 ${powerSaving ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-white/10 hover:bg-white/20'}`}>
                        {powerSaving ? <BoltSlashIcon className="size-5"/> : <BoltIcon className="size-5"/>}
                        <span>Power Saving</span>
                    </button>
                    <button id={"tilt-mode-mobile"} role="menuitem" onClick={() => {
                        toggleTiltMode();
                        setMenuOpen(false);
                    }}
                            aria-pressed={tiltMode}
                            className={`text-white no-underline px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-2 ${tiltMode ? 'bg-sky-700 hover:bg-sky-600' : 'bg-white/10 hover:bg-white/20'}`}>
                        <DeviceMoveIcon className="size-5"/>
                        <span>Device Tilt</span>
                    </button>
                    <button id={'start-tour-mobile'} role="menuitem" onClick={() => {
                        startTourForRoute(route);
                        setMenuOpen(false);
                    }}
                            className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20 flex items-center gap-2">
                        <QuestionMarkCircleIcon className="size-5"/> <span>How to use this app</span>
                    </button>
                    <a id={'source-link-mobile'} role="menuitem"
                       href="https://github.com/jblamber/fantasy-football-card-creator"
                       onClick={() => setMenuOpen(false)}
                       className="text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20 flex items-center gap-2">
                        <CodeBracketIcon className="size-5"/> <span>Source</span>
                    </a>
                </div>
            )}
        </>;
    }

    function DesktopMenu() {
        return <div className="hidden md:flex items-center gap-2">
            <ViewerBtn/>
            <EditBtn/>
            <PowerSavingBtn/>
            {/* Tile mode might not ever be used on desktop, so it self hides, but still included here */}
            <TiltModeBtn/>
            <StartTourBtn/>
            <SourceBtn/>
        </div>;
    }

    return (
        <nav
            className="fixed top-2 left-2 z-20 flex items-center gap-2 rounded-md border border-neutral-700/80
             bg-neutral-800/80 backdrop-blur px-1.5 py-1 shadow-md">

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
                {!powerSaving && (<div className="aurora">
                    <div className="aurora__item"></div>
                    <div className="aurora__item"></div>
                    <div className="aurora__item"></div>
                    <div className="aurora__item"></div>
                </div>)}
            </div>

            <DesktopMenu/>
            <MobileMenu/>

        </nav>
    )
}