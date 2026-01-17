import React from "react";
import { TourProvider } from './tour/TourProvider';
import CardApp from "./CardApp";
import { AppSettingsProvider } from './appSettings/AppSettingsProvider';

export default function App() {
    return (
        <AppSettingsProvider>
            <TourProvider>
                <CardApp></CardApp>
            </TourProvider>
        </AppSettingsProvider>
    );
}
