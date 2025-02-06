import { action, observable } from 'mobx';

import { type TelemetryActionName, type TelemetryScreenName } from '../../background/telemetry';
import { messenger } from '../messenger';

/**
 * Telemetry store.
 */
export class TelemetryStore {
    /**
     * Is telemetry enabled flag.
     *
     * NOTE: This flag only reflects "helpUsImprove" setting value, you should never change it directly.
     */
    @observable isTelemetryEnabled = false;

    /**
     * Sets telemetry enabled flag.
     *
     * @param enabled Telemetry enabled flag.
     */
    @action setIsTelemetryEnabled = (enabled: boolean): void => {
        this.isTelemetryEnabled = enabled;
    };

    /**
     * Toggles telemetry enabled flag.
     */
    @action toggleIsTelemetryEnabled = (): void => {
        this.setIsTelemetryEnabled(!this.isTelemetryEnabled);
    };

    /**
     * Sends a message to the background to send a page view telemetry event.
     *
     * @param screenName Name of the screen.
     */
    @action sendPageViewEvent = (screenName: TelemetryScreenName): void => {
        if (!this.isTelemetryEnabled) {
            return;
        }

        messenger.sendPageViewTelemetryEvent(screenName);
    };

    /**
     * Sends a message to the background to send a custom telemetry event.
     *
     * @param event Custom telemetry event data.
     */
    @action sendCustomEvent = (actionName: TelemetryActionName, screenName: TelemetryScreenName): void => {
        if (!this.isTelemetryEnabled) {
            return;
        }

        messenger.sendCustomTelemetryEvent(actionName, screenName);
    };
}
