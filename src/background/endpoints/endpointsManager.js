import _ from 'lodash';
import notifier from '../../lib/notifier';
import { measurePingToEndpointViaFetch } from '../connectivity/pingHelpers';

/**
 * EndpointsManager keeps endpoints in the memory and determines their ping on request
 */
class EndpointsManager {
    endpoints = {}; // { endpointId: { endpointInfo } }

    endpointsPings = {}; // { endpointId, ping }[]

    PING_TTL_MS = 1000 * 60 * 10; // 10 minutes

    lastPingMeasurementTime = null;

    pingsAreMeasuring = false;

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
     * @returns {{all: *, fastest: *} | null}
     */
    getEndpoints() {
        if (_.isEmpty(this.endpoints)) {
            return null;
        }

        // Start pings measurement
        this.measurePings();

        return this.getAll();
    }

    setEndpoints(endpoints) {
        if (_.isEqual(this.endpoints, endpoints)) {
            return this.endpoints;
        }

        this.endpoints = endpoints;
        this.measurePings();

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

        const MIN_RATIO = 0.5;
        if (undefinedPings.length > Math.ceil(endpointsPings.length * MIN_RATIO)) {
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
        if (this.pingsAreMeasuring) {
            return false;
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
     * @returns {Promise<void>}
     */
    async measurePings() {
        if (!this.shouldMeasurePings()) {
            return;
        }

        this.pingsAreMeasuring = true;

        const handleEndpointPingMeasurement = async (endpoint) => {
            const { id, domainName } = endpoint;
            const ping = await measurePingToEndpointViaFetch(domainName);

            const pingData = {
                endpointId: id,
                ping,
            };

            this.endpointsPings[id] = pingData;

            notifier.notifyListeners(notifier.types.ENDPOINTS_PING_UPDATED, pingData);

            return pingData;
        };

        await Promise.all(Object.values(this.endpoints).map(handleEndpointPingMeasurement));

        this.lastPingMeasurementTime = Date.now();
        this.pingsAreMeasuring = false;
    }
}

const endpointsManager = new EndpointsManager();

export default endpointsManager;
