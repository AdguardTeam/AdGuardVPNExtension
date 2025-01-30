import { useEffect } from 'react';

import { type TelemetryScreenName } from '../background/telemetry';

import { messenger } from './messenger';

export function useTelemetryPageViewEvent(screenName: TelemetryScreenName) {
    useEffect(() => {
        messenger.sendPageViewTelemetryEvent(screenName);
    }, []);
}
