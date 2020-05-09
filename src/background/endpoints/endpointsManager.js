import _ from 'lodash';
import {
    asyncMapByChunks,
    identity,
    sortedByDistances,
} from '../../lib/helpers';
import connectivity from '../connectivity';
import notifier from '../../lib/notifier';
import vpnProvider from '../providers/vpnProvider';
import log from '../../lib/logger';
import browserApi from '../browserApi';

const CURRENT_LOCATION = 'current.location';

/**
 * EndpointsManager keeps endpoints in the memory and determines their ping on request
 * and manages current location information
 */
class EndpointsManager {
    endpoints = {}; // { endpointId: { endpointInfo } }

    endpointsPings = {}; // { endpointId, ping }[]

    MAX_FASTEST_LENGTH = 3;

    CLOSEST_ENDPOINTS_AMOUNT = 5;

    PING_TTL_MS = 1000 * 60 * 2; // 2 minutes

    allPingsCheckTimeStamp = null;

    fastestPingsCheckTimeStamp = null;

    arePingsFresh = (timeStamp) => !!(timeStamp && timeStamp + this.PING_TTL_MS > Date.now());

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
            .map((endpoint) => this.enrichWithPing(endpoint, this.fastestPingsCheckTimeStamp))
            .reduce(this.arrToObjConverter, {});
        return fastest;
    }

    enrichWithPing = (endpoint, lastCheckTimeStamp) => {
        if (!this.arePingsFresh(lastCheckTimeStamp)) {
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
            .map((endpoint) => this.enrichWithPing(endpoint, this.allPingsCheckTimeStamp))
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

        const endpoints = Object.values(this.endpoints);
        const currentEndpoint = await currentEndpointPromise;
        const currentEndpointPing = await currentEndpointPingPromise;

        // Experimentally determined that fastest results of measurements
        // can be achieved with this batch size
        const BATCH_SIZE = 10;

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

        const { coordinates } = await this.getCurrentLocation();
        const sortedEndpoints = sortedByDistances(coordinates, endpoints);

        const closestEndpoints = sortedEndpoints.slice(0, this.CLOSEST_ENDPOINTS_AMOUNT);
        const otherEndpoints = sortedEndpoints.slice(this.CLOSEST_ENDPOINTS_AMOUNT);

        // First of all measures ping for closest endpoints
        // eslint-disable-next-line max-len
        await asyncMapByChunks(closestEndpoints, handleEndpointPingMeasurement, this.CLOSEST_ENDPOINTS_AMOUNT);
        this.fastestPingsCheckTimeStamp = Date.now();

        // When measuring of closest endpoints finished, we can determine fastest
        // eslint-disable-next-line max-len
        notifier.notifyListeners(notifier.types.FASTEST_ENDPOINTS_CALCULATED, this.getFastest());

        // then check ping of other endpoints
        await asyncMapByChunks(otherEndpoints, handleEndpointPingMeasurement, BATCH_SIZE);

        // When measuring of all endpoints finished, we can update fastest
        // eslint-disable-next-line max-len
        notifier.notifyListeners(notifier.types.FASTEST_ENDPOINTS_CALCULATED, this.getFastest());
        this.allPingsCheckTimeStamp = Date.now();
    }

    getCurrentLocationRemote = async () => {
        const MIDDLE_OF_EUROPE = { coordinates: [51.05, 13.73] }; // Chosen approximately
        let currentLocation;
        try {
            currentLocation = await vpnProvider.getCurrentLocation();
        } catch (e) {
            log.error(e.message);
        }

        // if current location wasn't received use predefined
        currentLocation = currentLocation || MIDDLE_OF_EUROPE;

        await browserApi.storage.set(CURRENT_LOCATION, currentLocation);

        return currentLocation;
    };

    getCurrentLocation = async () => {
        const currentLocation = await browserApi.storage.get(CURRENT_LOCATION);
        if (!currentLocation) {
            // update current location information in background
            return this.getCurrentLocationRemote();
        }
        return currentLocation;
    };
}

const endpointsManager = new EndpointsManager();

export default endpointsManager;
