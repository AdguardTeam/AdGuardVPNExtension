import _ from 'lodash';
import { sortByDistance } from '../../lib/helpers';
import endpointsPing from '../connectivity/endpointsPing';
import notifier from '../../lib/notifier';
import userLocation from './userLocation';

/**
 * EndpointsManager keeps endpoints in the memory and determines their ping on request
 */
class EndpointsManager {
    endpoints = {}; // { endpointId: { endpointInfo } }

    endpointsPings = {}; // { endpointId, ping }[]

    PING_TTL_MS = 1000 * 60 * 10; // 10 minutes

    lastPingMeasurementTime = null;

    arePingsFresh = () => {
        return !!(this.lastPingMeasurementTime
            && this.lastPingMeasurementTime + this.PING_TTL_MS > Date.now());
    };

    arrToObjConverter = (acc, endpoint) => {
        acc[endpoint.id] = endpoint;
        return acc;
    };

    enrichWithPing = (endpoint) => {
        if (!this.arePingsFresh()) {
            return endpoint;
        }

        const pingData = this.endpointsPings[endpoint.id];

        return pingData ? { ...endpoint, ping: pingData.ping } : endpoint;
    };

    /**
     * Returns all endpoints in the map
     * @returns {Object.<string, Endpoint>}
     */
    getAll = () => {
        return Object.values(this.endpoints)
            .map(this.enrichWithPing)
            .reduce(this.arrToObjConverter, {});
    };

    /**
     * Returns all endpoints and fastest endpoints in one object
     * @param currentEndpointPromise - information about current endpoint stored in the promise
     * @param currentEndpointPingPromise - ping of current endpoint stored in the promise
     * @returns {{all: *, fastest: *} | null}
     */
    getEndpoints(currentEndpointPromise, currentEndpointPingPromise) {
        if (_.isEmpty(this.endpoints)) {
            return null;
        }

        // Start pings determination
        this.measurePings(
            currentEndpointPromise,
            currentEndpointPingPromise
        );

        return this.getAll();
    }

    setEndpoints(endpoints) {
        if (_.isEqual(this.endpoints, endpoints)) {
            return this.endpoints;
        }

        this.endpoints = endpoints;

        notifier.notifyListeners(notifier.types.ENDPOINTS_UPDATED, this.getAll());

        return this.endpoints;
    }

    /**
     * This function is useful to recheck pings after internet connection being turned off
     * @returns {boolean}
     */
    areMajorityOfPingsEmpty() {
        const endpointsPings = Object.values(this.endpointsPings);
        const undefinedPings = endpointsPings
            .filter((endpointPing) => endpointPing.ping === undefined);

        if (undefinedPings.length > Math.ceil(endpointsPings.length / 2)) {
            return true;
        }

        return false;
    }

    shouldMeasurePings() {
        if (_.isEmpty(this.endpoints)) {
            return false;
        }
        if (this.areMajorityOfPingsEmpty()) {
            return true;
        }
        return !this.arePingsFresh();
    }

    /**
     * Steps of counting pings
     * 1. show skeleton for fastest on popup
     * 2. sort endpoints geographically (usually closest endpoints have smaller pings)
     *      ping results for:
     *      - unsorted endpoints (https://uploads.adguard.com/mtopciu_doppk.png)
     *      - sorted endpoints (https://uploads.adguard.com/mtopciu_whyro.png)
     * 3. start determining all pings
     * 4. every determined ping for endpoint should notify popup
     * 5. when popup receives 3 pings for endpoints it starts to display fastest endpoints
     * 6. pings need to be recalculated after 10 minutes passed when popup is opened
     * @param currentEndpointPromise
     * @param currentEndpointPingPromise
     * @returns {Promise<void>}
     */
    async measurePings(currentEndpointPromise, currentEndpointPingPromise) {
        if (!this.shouldMeasurePings()) {
            return;
        }

        const currentEndpoint = await currentEndpointPromise;
        const currentEndpointPing = await currentEndpointPingPromise;

        const handleEndpointPingMeasurement = async (endpoint) => {
            const { id, domainName } = endpoint;
            let ping;

            if (currentEndpointPing && currentEndpoint.id === id) {
                ping = currentEndpointPing;
            } else {
                ping = await endpointsPing.measurePingToEndpoint(domainName);
            }

            const pingData = {
                endpointId: id,
                ping,
            };

            this.endpointsPings[id] = pingData;

            notifier.notifyListeners(notifier.types.ENDPOINTS_PING_UPDATED, pingData);

            return pingData;
        };

        const currentLocation = await userLocation.getCurrentLocation();
        const sorted = sortByDistance(Object.values(this.endpoints), currentLocation);
        await Promise.all(sorted.map(handleEndpointPingMeasurement));

        this.lastPingMeasurementTime = Date.now();
    }

    updateEndpointPing = (endpointId, ping) => {
        if (!endpointId || !ping) {
            return;
        }
        const pingData = { endpointId, ping };
        this.endpointsPings[endpointId] = pingData;
        notifier.notifyListeners(notifier.types.ENDPOINTS_PING_UPDATED, pingData);
    }
}

const endpointsManager = new EndpointsManager();

export default endpointsManager;
