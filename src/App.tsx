import React from "react";
import { TourProvider } from './tour/TourProvider';
import CardApp from "./CardApp";
import { AppSettingsProvider } from './appSettings/AppSettingsProvider';
import { Auth0Provider } from '@auth0/auth0-react';

export default function App() {
    return (
        <Auth0Provider
            domain={import.meta.env.VITE_AUTH0_DOMAIN}
            clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: import.meta.env.VITE_AUTH0_API_AUDIENCE,
                scope: 'openid profile email read:decks write:decks'
            }}
        >
            <AppSettingsProvider>
                <TourProvider>
                    <CardApp></CardApp>
                </TourProvider>
            </AppSettingsProvider>
        </Auth0Provider>
    );
}
