export class Notifier {
    types = {};

    events = {};

    listeners = {};

    listenersEvents = {};

    listenerId = 0;

    getListenerId() {
        const id = this.listenerId;
        this.listenerId += 1;
        return id;
    }

    constructor(types) {
        this.types = types;
        Object.entries(this.types).forEach(([key, value]) => {
            this.events[value] = key;
        });
    }

    /**
     * Subscribes listener to the specified events
     *
     * @param {string} events - List of event types listener will be notified of
     * @param {function} listener - Listener object
     * @returns {number} Index of the listener
     */
    addSpecifiedListener(events, listener) {
        if (typeof listener !== 'function') {
            throw new Error('Illegal listener');
        }
        const listenerId = this.getListenerId();
        this.listeners[listenerId] = listener;
        this.listenersEvents[listenerId] = events;
        return listenerId;
    }

    /**
     * Subscribe specified listener to all events
     *
     * @param {function} listener Listener
     * @returns {number} Index of the listener
     */
    addListener(listener) {
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
    removeListener(listenerId) {
        delete this.listeners[listenerId];
        delete this.listenersEvents[listenerId];
    }

    /**
     * Notifies listeners about the events passed as arguments of this function.
     */
    notifyListeners(event, ...args) {
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
                listener.apply(listener, args);
            } catch (ex) {
                const message = `Error invoking listener for event: "${event}" cause: ${ex}`;
                throw new Error(message);
            }
        }
    }
}

const types = { SETTING_UPDATED: 'event.update.setting.value' };
const notifier = new Notifier(types);

export default notifier;
