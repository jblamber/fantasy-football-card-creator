import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {Deck} from "../types";

interface DecksApiResponse {
    decks: Deck[];
}

function UseDecksApi() {

    const {getAccessTokenSilently} = useAuth0();
    const [decksApiResponse, setApiResponse] = useState<DecksApiResponse | null>(null);

    const fetchDecks = async () => {
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: {
                    audience: import.meta.env.VITE_AUTH0_API_AUDIENCE,
                    scope: 'read:decks write:decks'
                }
            });
            const response = await fetch(`${import.meta.env.VITE_AUTH0_API_AUDIENCE}/decks`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            setApiResponse(data);
        } catch (error) {
            console.error('API call failed:', error);
        }
    };

    return {decksApiResponse, fetchDecks};
}

export default UseDecksApi;