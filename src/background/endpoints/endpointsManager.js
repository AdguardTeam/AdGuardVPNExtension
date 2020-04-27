import _ from 'lodash';
import { asyncMapByChunks, identity } from '../../lib/helpers';
import connectivity from '../connectivity';
import notifier from '../../lib/notifier';

/**
 * EndpointsManager keeps endpoints in the memory and determines their ping on request
 */
class EndpointsManager {
    endpoints = {}; // { endpointId: { endpointInfo } }

    endpointsPings = {}; // { endpointId, ping }[]

    MAX_FASTEST_LENGTH = 3;

    PING_TTL_MS = 1000 * 60 * 2; // 2 minutes

    lastPingMeasurementTime = null;

    arePingsFresh = () => {
        return !!(this.lastPingMeasurementTime
            && this.lastPingMeasurementTime + this.PING_TTL_MS > Date.now());
    };

    arrToObjConverter = (acc, endpoint) => {
        acc[endpoint.id] = endpoint;
        return acc;
    };

    /**
     * Returns fastest endpoints
     * @returns {Object.<string, Endpoint>}
     */
    getFastest() {
        const sortedPings = _.sortBy(Object.values(this.endpointsPings), ['ping']);
        const fastest = sortedPings
            .map(({ endpointId }) => {
                return this.endpoints[endpointId];
            })
            .filter(identity)
            .slice(0, this.MAX_FASTEST_LENGTH)
            .map(this.enrichWithPing)
            .reduce(this.arrToObjConverter, {});
        return fastest;
    }

    enrichWithPing = (endpoint) => {
        if (!this.arePingsFresh()) {
            return endpoint;
        }

        const endpointsPing = this.endpointsPings[endpoint.id];

        return endpointsPing ? { ...endpoint, ping: endpointsPing.ping } : endpoint;
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

        const fastest = this.getFastest();
        const all = this.getAll();

        return {
            fastest,
            all,
        };
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
                ping = await connectivity.endpointsPing.measurePingToEndpoint(domainName);
            }

            const pingData = {
                endpointId: id,
                ping,
            };

            this.endpointsPings[id] = pingData;

            notifier.notifyListeners(notifier.types.ENDPOINTS_PING_UPDATED, pingData);

            return pingData;
        };

        // Experimentally determined that fastest results of measurements
        // can be achieved with this batch size
        const BATCH_SIZE = 10;
        await asyncMapByChunks(
            Object.values(this.endpoints),
            handleEndpointPingMeasurement,
            BATCH_SIZE
        );

        this.lastPingMeasurementTime = Date.now();

        // When measuring finished, we can determine fastest
        notifier.notifyListeners(notifier.types.FASTEST_ENDPOINTS_CALCULATED, this.getFastest());
    }
}

const endpointsManager = new EndpointsManager();

export default endpointsManager;
