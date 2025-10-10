import { getForwarderUrl } from '../../common/helpers';
import { translator } from '../../common/translator';
import { FORWARDER_URL_QUERIES } from '../config';
import { type NotifierInterface } from '../../common/notifier';
import { type ForwarderInterface } from '../forwarder/forwarder';
import { type NotificationsInterface } from '../notifications';
import { type TabsInterface } from '../tabs';
import { type UpdateServiceInterface } from '../updateService';
import { getUrl } from '../browserApi/runtime';
import { type CredentialsInterface } from '../credentials/Credentials';

/**
 * {@link AuthSideEffects}} interface.
 */
export interface AuthSideEffectsInterface {
    /**
     * Initializes the auth side effects.
     */
    init(): void;
}

/**
 * Constructor parameters for {@link AuthSideEffects}.
 */
export interface AuthSideEffectsParameters {
    /**
     * Notifier service.
     */
    notifier: NotifierInterface;

    /**
     * Notifications service.
     */
    notifications: NotificationsInterface;

    /**
     * Update service.
     */
    updateService: UpdateServiceInterface;

    /**
     * Forwarder service.
     */
    forwarder: ForwarderInterface;

    /**
     * Tabs service.
     */
    tabs: TabsInterface;

    /**
     * Credentials service.
     */
    credentials: CredentialsInterface;
}

/**
 * Auth side effects class.
 *
 * This class is responsible for side effect actions that are performed related to auth.
 */
export class AuthSideEffects implements AuthSideEffectsInterface {
    /**
     * Success auth page path.
     */
    private static readonly SUCCESS_AUTH_PATH = '/success-auth.html';

    /**
     * Notifier service.
     */
    private notifier: NotifierInterface;

    /**
     * Notifications service.
     */
    private notifications: NotificationsInterface;

    /**
     * Update service.
     */
    private updateService: UpdateServiceInterface;

    /**
     * Forwarder service.
     */
    private forwarder: ForwarderInterface;

    /**
     * Tabs service.
     */
    private tabs: TabsInterface;

    /**
     * Credentials service.
     */
    private credentials: CredentialsInterface;

    /**
     * Constructor.
     */
    constructor({
        notifier,
        notifications,
        updateService,
        forwarder,
        tabs,
        credentials,
    }: AuthSideEffectsParameters) {
        this.notifier = notifier;
        this.notifications = notifications;
        this.updateService = updateService;
        this.forwarder = forwarder;
        this.tabs = tabs;
        this.credentials = credentials;
    }

    /** @inheritdoc */
    public init(): void {
        this.notifier.addSpecifiedListener(
            this.notifier.types.WEB_AUTH_FLOW_AUTHENTICATED,
            this.handleWebAuthFlowAuthenticated.bind(this),
        );
    }

    /**
     * Handles web auth flow successful authentication by:
     * - If it's first run shows notification and opens compare page.
     * - If it's not first run opens success auth page.
     */
    private async handleWebAuthFlowAuthenticated(): Promise<void> {
        /**
         * Reports helpUsImprove received from web auth flow to backend.
         * Also updates vpn credentials after auth so the user can connect to proxy right away.
         * We don't await it intentionally.
         */
        this.credentials.reportHelpUsImprove();

        if (this.updateService.isFirstRun) {
            // Notify user
            await this.notifications.create({
                message: translator.getMessage('authentication_successful_notification'),
            });

            const forwarderDomain = await this.forwarder.updateAndGetDomain();
            const comparePageUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.COMPARE_PAGE);
            await this.tabs.openTab(comparePageUrl);
        } else {
            const successAuthUrl = getUrl(AuthSideEffects.SUCCESS_AUTH_PATH);
            await this.tabs.openTab(successAuthUrl);
        }
    }
}
