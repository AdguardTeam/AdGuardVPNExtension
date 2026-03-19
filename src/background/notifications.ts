import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import { translator } from '../common/translator';
import { Prefs } from '../common/prefs';
import { getErrorMessage } from '../common/utils/error';
import { log } from '../common/logger';

import { type TelemetryInterface } from './telemetry/Telemetry';
import { TelemetryActionName, TelemetryScreenName } from './telemetry/telemetryEnums';

const DEFAULT_IMAGE_PATH = Prefs.ICONS.ENABLED['128'];
const DEFAULT_TITLE = translator.getMessage('short_name');

/**
 * Notification types for telemetry tracking.
 */
export enum NotificationType {
    FirstAuth = 'first_auth',
    PromoOffer = 'promo_offer',
    FreeTrafficLeft = 'free_traffic_left',
    SpeedReduced = 'speed_reduced',
}

/**
 * Mapping from notification type to telemetry action names.
 */
const NOTIFICATION_TELEMETRY_MAP: Record<NotificationType, {
    show: TelemetryActionName;
    click: TelemetryActionName;
}> = {
    [NotificationType.FirstAuth]: {
        show: TelemetryActionName.NotificationFirstAuth,
        click: TelemetryActionName.FirstAuthNotifyClick,
    },
    [NotificationType.PromoOffer]: {
        show: TelemetryActionName.NotificationPromoOffer,
        click: TelemetryActionName.PromoOfferNotifyClick,
    },
    [NotificationType.FreeTrafficLeft]: {
        show: TelemetryActionName.Notification500MbLeft,
        click: TelemetryActionName.FiveHundredMbLeftNotifyClick,
    },
    [NotificationType.SpeedReduced]: {
        show: TelemetryActionName.NotificationSpeedReduced,
        click: TelemetryActionName.SpeedReducedNotifyClick,
    },
};

export interface NotificationsInterface {
    create(options: { message: string, notificationType?: NotificationType }): Promise<void>;
}

class Notifications implements NotificationsInterface {
    /**
     * Map to store notification IDs and their types for click tracking.
     */
    private notifications: Map<string, NotificationType> = new Map();

    /**
     * Telemetry instance, injected via init().
     */
    private telemetry: TelemetryInterface | null = null;

    constructor() {
        this.initClickListener();
    }

    /**
     * Initializes notifications with telemetry dependency.
     *
     * Telemetry cannot be imported directly because it creates a circular dependency:
     * notifications -> telemetry -> appStatus -> settings -> connectivityService -> fsm
     * -> machine -> actions -> switcher -> connectivity -> endpointConnectivity -> notifications
     *
     * Using dependency injection via init() breaks this cycle.
     *
     * @param telemetry Telemetry service instance.
     */
    init(telemetry: TelemetryInterface): void {
        this.telemetry = telemetry;
    }

    /**
     * Initializes the click listener for notifications.
     */
    private initClickListener(): void {
        browser.notifications.onClicked.addListener((notificationId: string) => {
            this.handleNotificationClick(notificationId);
        });
    }

    /**
     * Handles notification click and sends telemetry event.
     */
    private handleNotificationClick(notificationId: string): void {
        const notificationType = this.notifications.get(notificationId);
        if (notificationType) {
            const telemetryAction = NOTIFICATION_TELEMETRY_MAP[notificationType].click;
            this.telemetry?.sendCustomEventDebounced(telemetryAction, TelemetryScreenName.Background);
            this.notifications.delete(notificationId);
        }
    }

    /**
     * Creates notification with provided message.
     *
     * @param options Notification options.
     * @param options.title Optional notification title.
     * @param options.message Notification message text.
     * @param options.notificationType Optional notification type for telemetry tracking.
     * @returns Promise that resolves when notification is created.
     */
    create = async (options: {
        title?: string,
        message: string,
        notificationType?: NotificationType,
    }): Promise<void> => {
        const { title, message, notificationType } = options;

        const notificationOptions: browser.Notifications.CreateNotificationOptions = {
            type: 'basic',
            iconUrl: DEFAULT_IMAGE_PATH,
            title: title || DEFAULT_TITLE,
            message,
        };

        try {
            const notificationId = nanoid();
            await browser.notifications.create(notificationId, notificationOptions);

            if (!notificationType) {
                log.debug('[vpn.Notifications]: No notification type provided, skipping telemetry');
                return;
            }

            this.notifications.set(notificationId, notificationType);

            const telemetryAction = NOTIFICATION_TELEMETRY_MAP[notificationType].show;
            this.telemetry?.sendCustomEventDebounced(telemetryAction, TelemetryScreenName.Background);
        } catch (error) {
            log.error('[vpn.Notifications]: ', getErrorMessage(error));
        }
    };
}

export const notifications = new Notifications();
