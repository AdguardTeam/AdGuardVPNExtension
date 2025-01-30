import { useCallback } from 'react';

import { type TelemetryActionName } from '../background/telemetry';

import { messenger } from './messenger';

export function useTelemetryCustomEvent(actionName: TelemetryActionName) {
    const handler = useCallback(async (): Promise<void> => {
        messenger.sendCustomTelemetryEvent(actionName);
    }, []);

    return handler;
}
