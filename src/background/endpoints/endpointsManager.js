import _ from 'lodash';
import notifier from '../../lib/notifier';
import { measurePingToEndpointViaFetch } from '../connectivity/pingHelpers';
import { NOT_AVAILABLE_STATUS } from '../../lib/constants';
import vpnProvider from '../providers/vpnProvider';
import log from '../../lib/logger';

/**
 * EndpointsManager keeps endpoints in the memory and determines their ping on request
 */
export class EndpointsManager {
    endpoints = {}; // { endpointId: { endpointInfo } }

    backupEndpoints = {}; // { endpointId: { endpointInfo } }

    endpointsPings = {}; // { endpointId, ping }[]

    PING_TTL_MS = 1000 * 60 * 10; // 10 minutes

    arrayToMap = (acc, endpoint) => {
        acc[endpoint.id] = endpoint;
        return acc;
    };

    enrichWithPing = (endpoint) => {
        const ping = this.endpointsPings[endpoint.id]?.ping;
        return { ...endpoint, ping };
    };

    /**
     * Checks ping for backup endpoint and returns backup endpoint if founds it
     * @param {Endpoint} endpoint
     * @returns {Endpoint}
     */
    checkBackupEndpoint = (endpoint) => {
        if (endpoint.ping && endpoint.ping !== NOT_AVAILABLE_STATUS) {
            return endpoint;
        }

        const backupEndpoint = Object.values(this.backupEndpoints)
            .find((e) => e.cityName === endpoint.cityName);

        if (!backupEndpoint) {
            return endpoint;
        }

        const backupPing = this.endpointsPings[backupEndpoint.id]?.ping;
        if (!backupPing) {
            return endpoint;
        }

        return { ...backupEndpoint, ping: backupPing };
    }

    /**
     * Returns all endpoints in the map
     * @returns {Object.<string, Endpoint>}
     */
    getAll = () => {
        const endpoints = Object.values(this.endpoints)
            .map(this.enrichWithPing)
            .map(this.checkBackupEndpoint)
            .reduce(this.arrayToMap, {});

        return endpoints;
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

    getEndpointsFromBackend = async (vpnToken) => {
        const endpointsObj = await vpnProvider.getEndpoints(vpnToken);
        const { endpoints, backupEndpoints } = endpointsObj;

        this.setEndpoints(endpoints);
        this.backupEndpoints = backupEndpoints;

        return endpoints;
    };

    setEndpoints(endpoints) {
        if (_.isEqual(this.endpoints, endpoints)) {
            return;
        }

        this.endpoints = endpoints;
        this.measurePings();

        notifier.notifyListeners(notifier.types.LOCATIONS_UPDATED, this.getAll());
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

            if (!ping) {
                log.debug('Looking backup endpoint for:', domainName);
                const backupEndpoint = Object.values(this.backupEndpoints)
                    .find((e) => e.cityName === endpoint.cityName);
                const backupDomainName = backupEndpoint?.domainName;
                if (backupDomainName) {
                    log.debug('Found backup endpoint:', backupDomainName);
                    ping = await measurePingToEndpointViaFetch(backupDomainName);
                    if (ping) {
                        const pingData = {
                            endpointId: backupDomainName,
                            ping,
                            measurementTime: Date.now(),
                            measuring: false,
                        };

                        this.endpointsPings[backupDomainName] = pingData;

                        notifier.notifyListeners(
                            notifier.types.ENDPOINT_BACKUP_FOUND,
                            {
                                backup: {
                                    ...backupEndpoint,
                                    ping,
                                },
                                endpoint,
                            }
                        );
                        notifier.notifyListeners(
                            notifier.types.LOCATION_PING_UPDATED,
                            pingData
                        );
                        log.debug(`Backup endpoint ping determined, replacing "${domainName}" with "${backupDomainName}"`);
                    } else {
                        log.debug('Unable to measure ping to backup endpoint:', backupDomainName);
                    }
                }

                ping = NOT_AVAILABLE_STATUS;
            }

            const pingData = {
                endpointId: id,
                ping,
                measurementTime: Date.now(),
                measuring: false,
            };

            this.endpointsPings[id] = pingData;

            notifier.notifyListeners(notifier.types.LOCATION_PING_UPDATED, pingData);
        };

        await Promise.all(Object.values(this.endpoints).map(handleEndpointPingMeasurement));
    }
}

const endpointsManager = new EndpointsManager();

export default endpointsManager;
