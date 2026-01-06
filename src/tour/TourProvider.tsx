import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import Joyride, {STATUS, type CallBackProps, type Step} from 'react-joyride';

interface TourContextValue {
    startCreatorTour: () => void;
    startViewerTour: () => void;
    startTourForRoute: (route: string) => void;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

function useStableSteps() {
    const creatorSteps: Step[] = useMemo(() => [
        {
            target: '[data-tour-id="deck-editor"]',
            content:
                'This is the Deck editor, where you can create new decks, and make adjustments to player statistics.',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="save"]',
            content: 'This is the Save button. Click it to make sure the latest changes are synced to your device storage.',
        },
        {
            target: '[data-tour-id="new-deck"]',
            content: 'Add a new deck your device with this button',
        },
        {
            target: '[data-tour-id="download-deck"]',
            content: 'Download your current deck for sharing to a new device. Use the upload button to add a new deck.',
        },
    ], []);

    const viewerSteps: Step[] = useMemo(() => [
        {
            target: '[data-tour-id="deck-preview"]',
            content: 'This is the deck preview, Swipe left and right to change cards.',
            disableBeacon: true,
        },
        {
            target: '[data-tour-id="skills"]',
            content:
                "Tap on your player's skills to remind yourself of the rules",
        },
        {
            target: '[data-tour-id="download-card"]',
            content:
                'Download an image of your card for keeping in your gallery',
        },
        {
            target: '[data-tour-id="card-notes"]',
            content:
                'This is the notes section. As you are using your cards in gameplay, capture notes here about injuries or upgrades etc.',
        },
    ], []);

    return {creatorSteps, viewerSteps};
}

export function TourProvider({children}: { children: React.ReactNode }) {
    const {creatorSteps, viewerSteps} = useStableSteps();

    const [run, setRun] = useState(false);
    const [steps, setSteps] = useState<Step[]>(creatorSteps);

    const startCreatorTour = useCallback(() => {
        setSteps(creatorSteps);
        setRun(true);
    }, [creatorSteps]);

    const startViewerTour = useCallback(() => {
        setSteps(viewerSteps);
        setRun(true);
    }, [viewerSteps]);

    const startTourForRoute = useCallback((route: string) => {
        if (route === '/create') startCreatorTour();
        else startViewerTour();
    }, [startCreatorTour, startViewerTour]);

    const onTourCallback = useCallback((data: CallBackProps) => {
        const {status} = data;
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setRun(false);
            try {
                localStorage.setItem('ffcgTourSeen', '1');
            } catch {
            }
        }
    }, []);

    // First-time auto-run on creator if available
    useEffect(() => {
        try {
            const seen = localStorage.getItem('ffcgTourSeen');
            if (!seen) {
                const [, routeAndQuery] = (window.location.hash || '#/viewer').split('#');
                const [route] = (routeAndQuery || '/viewer').split('?');
                if (route === '/create') {
                    startCreatorTour();
                }
            }
        } catch {
        }
    }, [startCreatorTour]);

    const value = useMemo<TourContextValue>(() => ({
        startCreatorTour,
        startViewerTour,
        startTourForRoute,
    }), [startCreatorTour, startViewerTour, startTourForRoute]);

    return (
        <TourContext.Provider value={value}>
            {/* Global Joyride instance */}
            <Joyride
                run={run}
                steps={steps}
                callback={onTourCallback}
                continuous
                showProgress
                showSkipButton
                scrollToFirstStep
                disableOverlayClose={false}
                styles={{
                    options: {
                        arrowColor: '#171717',
                        backgroundColor: '#171717',
                        textColor: '#e5e5e5',
                        primaryColor: '#0284c7',
                        zIndex: 10000,
                    },
                    tooltipContainer: {textAlign: 'left'},
                }}
            />
            {children}
        </TourContext.Provider>
    );
}

export function useTour() {
    const ctx = useContext(TourContext);
    if (!ctx) throw new Error('useTour must be used within a TourProvider');
    return ctx;
}
