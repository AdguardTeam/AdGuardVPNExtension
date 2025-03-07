import { action, observable } from 'mobx';

import {
    type TelemetryActionName,
    type TelemetryScreenName,
    type TelemetryActionToScreenMap,
} from '../../background/telemetry';
import { messenger } from '../messenger';
import { log } from '../logger';

/**
 * Telemetry store.
 *
 * This store is integrated into both popup and option page's
 * global stores. This is why it's located in the common folder.
 */
export class TelemetryStore {
    /**
     * Is help us improve setting enabled.
     *
     * NOTE: This flag only mirrors "helpUsImprove" setting value, you should never change it directly.
     */
    @observable isHelpUsImproveEnabled = false;

    /**
     * ID of the current page.
     */
    @observable pageId: string | null = null;

    /**
     * Sets the "help us improve" setting.
     *
     * NOTE: This method should be called only on initialization
     * and when value is changed from background, never call it directly.
     *
     * @param isEnabled Is help us improve setting enabled.
     */
    @action setIsHelpUsImproveEnabled = (isEnabled: boolean): void => {
        this.isHelpUsImproveEnabled = isEnabled;
    };

    /**
     * Adds new opened page to telemetry service.
     */
    @action addOpenedPage = async (): Promise<void> => {
        try {
            this.pageId = await messenger.addTelemetryOpenedPage();
        } catch (e) {
            log.debug('Failed to add opened page to telemetry service', e);
        }
    };

    /**
     * Removes previously added opened page from telemetry service.
     */
    @action removeOpenedPage = async (): Promise<void> => {
        try {
            if (!this.pageId) {
                return;
            }

            await messenger.removeTelemetryOpenedPage(this.pageId);
            this.pageId = null;
        } catch (e) {
            log.debug('Failed to remove opened page from telemetry service', e);
        }
    };

    /**
     * Sends a message to the background to send a page view telemetry event if telemetry is enabled.
     *
     * NOTE: Do not await this function, as it is not necessary to wait for the response.
     *
     * @param screenName Name of the screen.
     */
    sendPageViewEvent = async (screenName: TelemetryScreenName): Promise<void> => {
        try {
            if (!this.isHelpUsImproveEnabled) {
                return;
            }

            await messenger.sendPageViewTelemetryEvent(screenName);
        } catch (e) {
            log.debug('Failed to send page view telemetry event', e);
        }
    };

    /**
     * Sends a message to the background to send a custom telemetry event if telemetry is enabled.
     *
     * NOTE: Do not await this function, as it is not necessary to wait for the response.
     *
     * @param event Custom telemetry event data.
     */
    sendCustomEvent = async <T extends TelemetryActionName>(
        actionName: T,
        screenName: TelemetryActionToScreenMap[T],
    ): Promise<void> => {
        try {
            if (!this.isHelpUsImproveEnabled) {
                return;
            }

            await messenger.sendCustomTelemetryEvent(actionName, screenName);
        } catch (e) {
            log.debug('Failed to send custom telemetry event', e);
        }
    };
}
