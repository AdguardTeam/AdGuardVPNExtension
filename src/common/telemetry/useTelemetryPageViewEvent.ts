import { useEffect } from 'react';

import { type TelemetryScreenName } from '../../background/telemetry';

import { type TelemetryStore } from './TelemetryStore';

/**
 * Hook that sends a page view telemetry event when `condition` is `true`.
 *
 * `condition` param can be used in 3 cases:
 * 1) Default behavior is to send telemetry event when the component is mounted.
 * 2) When specified `screenName` is overlapped by another screen, and you need to send telemetry
 *    event when another screen is closed. For example, when you have a dialog that rendered
 *   on top of `screenName`, and you want to send telemetry event when dialog gets closed.
 * 3) When specified `screenName` is rendered conditionally, and you want to send telemetry event,
 *    only when the `screenName` is rendered. For example, dialog that is rendered only when
 *    `condition` is `true`.
 *
 * @param telemetryStore Telemetry store instance.
 * @param screenName Name of the screen to be logged in telemetry.
 * @param condition Condition when the telemetry event should be sent.
 */
export function useTelemetryPageViewEvent(
    telemetryStore: TelemetryStore,
    screenName: TelemetryScreenName,
    condition = true,
) {
    useEffect(() => {
        if (!condition) {
            return;
        }

        telemetryStore.sendPageViewEvent(screenName);
    }, [condition]);
}
