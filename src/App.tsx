import React from "react";
import { TourProvider } from './tour/TourProvider';
import CardApp from "./CardApp";

export default function App() {


    return (
        <TourProvider>
            <CardApp></CardApp>
        </TourProvider>
    );
}
