import _ from 'lodash';
import notifier from '../../lib/notifier';
import { measurePingToEndpointViaFetch } from '../connectivity/pingHelpers';
import { NOT_AVAILABLE_STATUS } from '../../lib/constants';

/**
 * EndpointsManager keeps endpoints in the memory and determines their ping on request
 */
export class EndpointsManager {
    endpoints = {}; // { endpointId: { endpointInfo } }

    endpointsPings = {}; // { endpointId, ping }[]

    PING_TTL_MS = 1000 * 60 * 10; // 10 minutes

    arrToObjConverter = (acc, endpoint) => {
        acc[endpoint.id] = endpoint;
        return acc;
    };

    enrichWithPing = (endpoint) => {
        const ping = this.endpointsPings[endpoint.id]?.ping;
        return { ...endpoint, ping };
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
     * @param {boolean} [measurePings=true] - only for tests purposes we do not measure pings
     * @returns {Object.<string, Endpoint> | null}
     */
    getEndpoints = (measurePings = true) => {
        if (_.isEmpty(this.endpoints)) {
            return null;
        }

        if (measurePings) {
            // Start pings measurement
            this.measurePings();
        }

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
     * Steps of measuring pings
     * 1. Start counting all pings together
     * 2. When every ping value is ready, notify to update popup
     * 3. We should recalculate ping every time if it didn't have previous ping value or
     *  if ping ttl expired
     * @returns {Promise<void>}
     */
    async measurePings() {
        if (!this.endpoints) {
            return;
        }

        const handleEndpointPingMeasurement = async (endpoint) => {
            const { id, domainName } = endpoint;

            const pingsData = this.endpointsPings?.[id];
            const isMeasuring = pingsData?.measuring;
            if (isMeasuring) {
                return;
            }

            const measurementTime = pingsData?.measurementTime;
            const isFresh = measurementTime
                ? Date.now() - measurementTime <= this.PING_TTL_MS
                : false;

            const prevPing = pingsData?.ping;
            const hasPing = !(!prevPing || prevPing === NOT_AVAILABLE_STATUS);

            if (isFresh && hasPing) {
                return;
            }

            this.endpointsPings[id] = pingsData
                ? { ...pingsData, measuring: true }
                : {
                    endpointId: id,
                    ping: null,
                    measuring: true,
                };

            let ping = await measurePingToEndpointViaFetch(domainName);

            // TODO start using backup endpoints also
            if (!ping) {
                ping = NOT_AVAILABLE_STATUS;
            }

            const pingData = {
                endpointId: id,
                ping,
                measurementTime: Date.now(),
                measuring: false,
            };

            this.endpointsPings[id] = pingData;

            notifier.notifyListeners(notifier.types.ENDPOINTS_PING_UPDATED, pingData);
        };

        await Promise.all(Object.values(this.endpoints).map(handleEndpointPingMeasurement));
    }
}

const endpointsManager = new EndpointsManager();

export default endpointsManager;
