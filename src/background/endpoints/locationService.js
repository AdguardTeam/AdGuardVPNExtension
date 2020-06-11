import { measurePingToEndpointViaFetch } from '../connectivity/pingHelpers';
import notifier from '../../lib/notifier';

class LocationService {
    PING_TTL_MS = 1000 * 60 * 10; // 10 minutes

    pingsCache = {};

    updatePingsInfo = (id, newData) => {
        const oldData = this.pingsCache[id];
        if (oldData) {
            this.pingsCache[id] = { ...oldData, ...newData };
        } else {
            this.pingsCache[id] = {
                ping: null,
                lastMeasurementTime: 0,
                ...newData,
            };
        }
    };

    getEndpoint = async (location) => {
        const { ping, endpoint } = await this.getEndpointAndPing(location);

        location.setPing(ping);
        location.setAvailable(!!ping);

        this.updatePingsInfo(
            location.id,
            {
                ping,
                lastMeasurementTime: Date.now(),
            }
        );

        notifier.notifyListeners(
            notifier.types.LOCATION_STATE_UPDATED,
            {
                locationId: location.id,
                ping,
                available: location.available,
            }
        );

        if (!location.available) {
            return location.endpoints[0];
        }

        return endpoint;
    }

    measurePing = async (location) => {
        const { id } = location;

        // Do not begin pings measurement while it is measuring yet
        if (this.pingsCache[id]?.isMeasuring) {
            return;
        }

        const lastMeasurementTime = this.pingsCache[id]?.lastMeasurementTime;
        const isFresh = lastMeasurementTime
            ? !(Date.now() - lastMeasurementTime >= this.PING_TTL_MS)
            : false;
        let ping = this.pingsCache[id]?.ping;
        const hasPing = !!ping;

        if (isFresh && hasPing) {
            location.setPing(ping);
            location.setAvailable(!!ping);
            return;
        }

        this.updatePingsInfo(location, { isMeasuring: true });
        const endpointAndPing = await this.getEndpointAndPing(location);
        ({ ping } = endpointAndPing);

        location.setPing(ping);
        location.setAvailable(!!ping);

        this.updatePingsInfo(
            location.id,
            {
                ping,
                isMeasuring: false,
                lastMeasurementTime: Date.now(),
            }
        );

        notifier.notifyListeners(
            notifier.types.LOCATION_STATE_UPDATED,
            {
                locationId: id,
                ping,
                available: location.available,
            }
        );
    }

    /**
     * Measures pings to endpoints one by one, and returns first one available
     * If was unable to measure ping to all endpoints, returns first endpoint from the list
     * @param location
     * @returns {Promise<{endpoint: <Endpoint>, ping: (number|null)}>}
     */
    async getEndpointAndPing(location) {
        let endpoint;
        let ping = null;
        let i = 0;
        while (!ping && location.endpoints[i]) {
            endpoint = location.endpoints[i];
            // eslint-disable-next-line no-await-in-loop
            ping = await measurePingToEndpointViaFetch(endpoint.domainName) || null;
            i += 1;
        }

        if (!ping) {
            [endpoint] = location.endpoints;
        }

        return {
            ping,
            endpoint,
        };
    }
}

export const locationService = new LocationService();
