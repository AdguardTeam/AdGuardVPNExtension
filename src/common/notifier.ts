export enum NotifierType {
    SETTING_UPDATED = 'event.update.setting.value',
    NON_ROUTABLE_DOMAIN_FOUND = 'event.found.non.routable.domain',
    TOO_MANY_DEVICES_CONNECTED = 'event.too.many.devices.connected',
    NON_ROUTABLE_DOMAIN_ADDED = 'event.added.non.routable.domain',
    CREDENTIALS_UPDATED = 'event.credentials.updated',
    USER_AUTHENTICATED = 'event.authentication.authenticated',
    USER_DEAUTHENTICATED = 'event.authentication.deauthenticated',
    TAB_UPDATED = 'event.tab.updated',
    TAB_ACTIVATED = 'event.tab.activated',
    EXCLUSIONS_UPDATED_BACK_MESSAGE = 'event.exclusions.updated.back.message',
    EXCLUSIONS_DATA_UPDATED = 'event.exclusions.data.updated',
    SHOULD_REFRESH_TOKENS = 'event.should.refresh.tokens',
    DNS_SERVER_SET = 'event.dns.server.set',
    UPDATE_BROWSER_ACTION_ICON = 'event.update.browser.action.icon',
    SHOW_RATE_MODAL = 'event.show.rate.modal',
    AUTH_CACHE_UPDATED = 'event.auth.cache.updated',

    VPN_INFO_UPDATED = 'event.vpn.info.updated',
    LOCATIONS_UPDATED = 'event.locations.updated',
    CURRENT_LOCATION_UPDATED = 'event.current.location.updated',
    PERMISSIONS_ERROR_UPDATE = 'event.permission.error.update',
    TOKEN_PREMIUM_STATE_UPDATED = 'event.token.premium.state.updated',
    TRAFFIC_STATS_UPDATED = 'event.traffic.stats.updated',
    STATS_UPDATED = 'event.stats.updated',

    // Connectivity state
    CONNECTIVITY_STATE_CHANGED = 'event.connectivity.state.changed',

    SERVER_ERROR = 'server.error',

    // Background page connection events
    PORT_CONNECTED = 'event.port.connected',
    PORT_DISCONNECTED = 'event.port.disconnected',

    WEB_AUTH_FLOW_AUTHENTICATED = 'event.web.auth.flow.authenticated',
}

export type NotifierTypeMap = {
    [key in keyof typeof NotifierType]: NotifierType
};

type EventMap = {
    [key: string]: string
};

type ListenerHandler = {
    (...args: any): void,
};

type ListenersMap = {
    [key: string]: ListenerHandler;
};

type ListenersEventsMap = {
    [key: string]: string | string[];
};

export class Notifier {
    types: NotifierTypeMap;

    events: EventMap = {};

    listeners: ListenersMap = {};

    listenersEvents: ListenersEventsMap = {};

    listenerId = 0;

    getListenerId(): string {
        const id = this.listenerId;
        this.listenerId += 1;
        return id.toString();
    }

    constructor(types: NotifierTypeMap) {
        this.types = types;
        Object.entries(this.types).forEach(([key, value]) => {
            this.events[value] = key;
        });
    }

    /**
     * Subscribes listener to the specified events and returns index of the listener
     *
     * @param events - List of event types listener will be notified of
     * @param listener - Listener object
     *
     * @returns Listener id.
     */
    addSpecifiedListener(events: string | string[], listener: ListenerHandler): string {
        if (typeof listener !== 'function') {
            throw new Error('Illegal listener');
        }
        if (!Array.isArray(events)) {
            // eslint-disable-next-line no-param-reassign
            events = [events];
        }
        const listenerId = this.getListenerId();
        this.listeners[listenerId] = listener;
        this.listenersEvents[listenerId] = events;
        return listenerId;
    }

    /**
     * Subscribes specified listener to all events and returns index of the listener
     *
     * @param listener Listener
     *
     * @returns Listener id.
     */
    addListener(listener: ListenerHandler): string {
        if (typeof listener !== 'function') {
            throw new Error('Illegal listener');
        }
        const listenerId = this.getListenerId();
        this.listeners[listenerId] = listener;
        return listenerId;
    }

    /**
     * Unsubscribe listener
     * @param listenerId Index of listener to unsubscribe
     */
    removeListener(listenerId: string): void {
        delete this.listeners[listenerId];
        delete this.listenersEvents[listenerId];
    }

    /**
     * Notifies listeners about the events passed as arguments of this function.
     */
    notifyListeners(event: NotifierType, ...args: unknown[]): void {
        if (!event || !(event in this.events)) {
            throw new Error(`Illegal event: ${event}`);
        }
        // eslint-disable-next-line no-restricted-syntax
        for (const [listenerId, listener] of Object.entries(this.listeners)) {
            const events = this.listenersEvents[listenerId];
            if (events && events.length > 0 && events.indexOf(event) < 0) {
                // eslint-disable-next-line no-continue
                continue;
            }
            try {
                if (events && events.length > 1) {
                    // if listener was added for many events, notify with event title
                    listener.apply(listener, [event, ...args]);
                } else {
                    // otherwise, notify without event title
                    listener.apply(listener, args);
                }
            } catch (ex) {
                const message = `Error invoking listener for event: "${event}" cause: ${ex}`;
                throw new Error(message);
            }
        }
    }
}

export type NotifierInterface = InstanceType<typeof Notifier>;

export const notifier = new Notifier(NotifierType);
