import { useCallback } from 'react';

import { type TelemetryActionName } from '../background/telemetry';

import { messenger } from './messenger';

/**
 * Hook that returns a callback that sends a custom telemetry event when called.
 *
 * @param actionName Name of the action to be logged in telemetry.
 * @returns Callback that sends a custom telemetry event when called.
 */
export function useTelemetryCustomEvent(actionName: TelemetryActionName) {
    const handler = useCallback(async (): Promise<void> => {
        messenger.sendCustomTelemetryEvent(actionName);
    }, []);

    return handler;
}
