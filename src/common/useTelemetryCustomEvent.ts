import { useCallback } from 'react';

import { type TelemetryActionName } from '../background/telemetry';

import { messenger } from './messenger';

/**
 * Hook that returns a callback that sends a custom telemetry event when called.
 *
 * @param name Name of the action to be logged in telemetry.
 * @param action Action name.
 * @param label Label name.
 * @returns Callback that sends a custom telemetry event when called.
 */
export function useTelemetryCustomEvent(
    name: TelemetryActionName,
    action?: string,
    label?: string,
) {
    // Take a note that dependencies are not passed to useCallback
    // intentionally to avoid unnecessary re-renders.
    const handler = useCallback(async (): Promise<void> => {
        await messenger.sendCustomTelemetryEvent({
            name,
            action,
            label,
        });
    }, []);

    return handler;
}
