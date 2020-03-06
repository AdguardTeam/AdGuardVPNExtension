import _ from 'lodash';
import { MESSAGES_TYPES } from '../../lib/constants';
import { asyncMapByChunks, identity, runWithCancel } from '../../lib/helpers';
import log from '../../lib/logger';

/**
 * EndpointsManager keeps endpoints in the memory and determines their ping on request
 */
class EndpointsManager {
    endpoints = {}; // { endpointId: { endpointInfo } }

    endpointsPings = {}; // { endpointId, ping }[]

    MAX_FASTEST_LENGTH = 3;

    PING_TTL_MS = 1000 * 60 * 2; // 2 minutes

    lastPingMeasurementTime = null;

    constructor(browserApi, connectivity) {
        this.browserApi = browserApi;
        this.connectivity = connectivity;
        this.storage = browserApi.storage;
    }

    arePingsFresh = () => {
        return !!(this.lastPingMeasurementTime
            && this.lastPingMeasurementTime + this.PING_TTL_MS > Date.now());
    };

    arrToObjConverter = (acc, endpoint) => {
        acc[endpoint.id] = endpoint;
        return acc;
    };

    /**
     * Returns promise with fastest endpoints which resolves after measurement ping promise resolve
     * Generator function is used here because it can be canceled.
     * @param {Promise} measurePingsPromise
     * @returns {Generator<*>}
     */
    * getFastestGenerator(measurePingsPromise) {
        yield measurePingsPromise;
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

    async getFastest(measurePingsPromise) {
        const { promise, cancel } = runWithCancel(
            this.getFastestGenerator.bind(this),
            measurePingsPromise
        );

        this.fastestCancel = cancel;
        return promise
            .catch((e) => log.warn(e.reason));
    }

    cancelGetFastest(reason) {
        if (this.fastestCancel) {
            this.fastestCancel(reason);
        }
    }

    enrichWithPing = (endpoint) => {
        if (!this.arePingsFresh()) {
            return endpoint;
        }

        const endpointsPing = this.endpointsPings[endpoint.id];

        return endpointsPing ? { ...endpoint, ping: endpointsPing.ping } : endpoint;
    };

    getAll = () => {
        return Object.values(this.endpoints)
            .map(this.enrichWithPing)
            .reduce(this.arrToObjConverter, {});
    };

    /**
     * Returns all endpoints and fastest endpoints promise in one object
     * @param currentEndpointPromise - information about current endpoint stored in the promise
     * @param currentEndpointPingPromise - ping of current endpoint stored in the promise
     * @returns {{all: *, fastest: Promise<*>} | null}
     */
    getEndpoints(currentEndpointPromise, currentEndpointPingPromise) {
        if (_.isEmpty(this.endpoints)) {
            return null;
        }

        const measurePingsPromise = this.measurePings(
            currentEndpointPromise,
            currentEndpointPingPromise
        );

        const fastest = this.getFastest(measurePingsPromise);
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

        this.browserApi.runtime.sendMessage({
            type: MESSAGES_TYPES.ENDPOINTS_UPDATED,
            data: this.getAll(),
        });

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
                ping = await this.connectivity.endpointsPing.measurePingToEndpoint(domainName);
            }

            const pingData = {
                endpointId: id,
                ping,
            };

            this.endpointsPings[id] = pingData;

            await this.browserApi.runtime.sendMessage({
                type: MESSAGES_TYPES.ENDPOINTS_PING_UPDATED,
                data: pingData,
            });

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
    }
}

export default EndpointsManager;
