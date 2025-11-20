import { action, observable } from 'mobx';

import {
    type TelemetryActionName,
    type TelemetryScreenName,
    type TelemetryActionToScreenMap,
} from '../../background/telemetry/telemetryEnums';
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
     * Removes previously added opened page from telemetry service.
     *
     * Note: This method should be called only from options page,
     * for popup page we have separate handling based on background connection,
     * since popup page does not fires unload event.
     */
    @action removeOpenedPage = async (): Promise<void> => {
        try {
            if (!this.pageId) {
                return;
            }

            // Delete from store first to prevent race condition
            const { pageId } = this;
            this.pageId = null;
            await messenger.removeTelemetryOpenedPage(pageId);
        } catch (e) {
            log.debug('Failed to remove opened page from telemetry service', e);
        }
    };

    /**
     * Sets the page ID.
     *
     * @param pageId Page ID.
     */
    @action setPageId = (pageId: string | null): void => {
        // Guard against multiple calls, allow to set page ID only once or to `null`
        if (this.pageId && pageId) {
            log.error(`Cannot set page ID: already set to '${this.pageId}'`);
            return;
        }

        this.pageId = pageId;
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

            if (!this.pageId) {
                log.error(`Cannot send page view telemetry event: missing page ID for screen '${screenName}'`);
                return;
            }

            await messenger.sendPageViewTelemetryEvent(screenName, this.pageId);
        } catch (e) {
            log.debug('Failed to send page view telemetry event', e);
        }
    };

    /**
     * Sends a message to the background to send a custom telemetry event if telemetry is enabled.
     *
     * NOTE: Do not await this function, as it is not necessary to wait for the response.
     *
     * @param actionName Name of the action.
     * @param screenName Name of the screen.
     * @param label Optional label for the event.
     */
    sendCustomEvent = async <T extends TelemetryActionName>(
        actionName: T,
        screenName: TelemetryActionToScreenMap[T],
        label?: string,
    ): Promise<void> => {
        try {
            if (!this.isHelpUsImproveEnabled) {
                return;
            }

            await messenger.sendCustomTelemetryEvent(actionName, screenName, label);
        } catch (e) {
            log.debug('Failed to send custom telemetry event', e);
        }
    };
}
