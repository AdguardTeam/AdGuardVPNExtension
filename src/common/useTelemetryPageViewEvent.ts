import { useCallback, useEffect } from 'react';

import { type TelemetryScreenName } from '../background/telemetry';

import { messenger } from './messenger';

/**
 * Hook that sends a page view telemetry event when the component is mounted.
 *
 * @param screenName Name of the screen to be logged in telemetry.
 * @returns Callback that reverts the page view telemetry event (use only for nested screens, e.g. dialog).
 */
export function useTelemetryPageViewEvent(screenName: TelemetryScreenName) {
    // Take a note that dependencies are not passed to useEffect
    // intentionally to avoid unnecessary re-renders.
    useEffect(() => {
        messenger.sendPageViewTelemetryEvent(screenName);
    }, []);

    const revert = useCallback(async (): Promise<void> => {
        messenger.revertPageViewTelemetryEvent();
    }, []);

    return revert;
}
