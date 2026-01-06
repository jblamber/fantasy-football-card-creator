import {ToastContainer} from "react-toastify";
import {PlayIcon} from "@heroicons/react/16/solid";
import {PencilSquareIcon} from "@heroicons/react/24/solid";
import {CardCreator} from "./card/CardCreator";
import {CardViewer} from "./card/CardViewer";
import React, {useEffect, useState} from "react";
import {useHashRoute} from "./utils/UseHashRoute";
import {getCurrentDeckId, listDecks, LocalDeck } from "./services/localDecks";
import {CardAppNavigation} from "./CardAppNavigation";

export default function CardApp() {

    const hash = useHashRoute();
    const [, routeAndQuery] = hash.split("#");
    const [route] = (routeAndQuery || "/viewer").split("?");


    // Local decks state for nav select when on /create
    const [decks, setDecks] = useState<LocalDeck[]>([]);
    const [currentId, setCurrentId] = useState<string | null>(null);

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


  return (
    <div className="min-h-screen">
        <ToastContainer theme={'dark'} />
        <CardAppNavigation currentId={currentId} setCurrentId={setCurrentId} decks={decks}/>
        <div className="pt-12 max-w-[900px] mx-auto">
            {route === "/create" ? <CardCreator/> : <CardViewer/>}
        </div>
    </div>
  )
}