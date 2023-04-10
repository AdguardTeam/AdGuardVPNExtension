import flattenDeep from 'lodash/flattenDeep';
import uniq from 'lodash/uniq';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs';
import { getDomain } from 'tldts';

import { log } from '../../lib/logger';
import { getLocationWithLowestPing, sleep } from '../../lib/helpers';
import { POPUP_DEFAULT_SUPPORT_URL } from '../config';
import { notifier } from '../../lib/notifier';
import { proxy } from '../proxy';
import { vpnProvider } from '../providers/vpnProvider';
import { LocationWithPing } from './LocationWithPing';
import { endpointsTldExclusions } from '../proxy/endpointsTldExclusions';

// eslint-disable-next-line import/no-cycle
import { connectivity } from '../connectivity';
import { credentials } from '../credentials';
import { locationsService, isMeasuringPingInProgress } from './locationsService';
// eslint-disable-next-line import/no-cycle
import { isVPNConnected, isVPNDisconnectedIdle } from '../connectivity/connectivityService/connectivityFSM';
import type {
    EndpointInterface,
    VpnTokenData,
    VpnExtensionInfoInterface,
    CredentialsDataInterface,
} from '../schema';
import type { LocationInterface } from './Location';
import { settings } from '../settings';
import { QuickConnectSetting } from '../../lib/constants';
import { EndpointsState, StorageKey } from '../schema';
import { sessionState } from '../sessionStorage';

/**
 * Endpoint properties
 * @typedef {Object} Endpoint
 * @property {string} id
 * @property {string} domainName
 * @property {string} ipv4Address
 * @property {string} ipv6Address
 * @property {string} publicKey
 */

/**
 * Locations properties
 * @typedef {Object} Location
 * @property {string} id
 * @property {string} cityName
 * @property {string} countryCode
 * @property {string} countryName
 * @property {[number, number]} coordinates [longitude, latitude]
 * @property {Endpoint[]} endpoints
 * @property {boolean} premiumOnly
 */

export interface EndpointsInterface {
    refreshData(): Promise<void>;
    getVpnInfo(): Promise<VpnExtensionInfoInterface | null>;
    getSelectedLocation(): Promise<LocationWithPing | null>;
    getLocations(): LocationWithPing[];
    getVpnFailurePage(): Promise<string>;
    init(): void;
}

/**
 * Endpoints manages endpoints, vpn, current location information.
 */
class Endpoints implements EndpointsInterface {
    state: EndpointsState;

    constructor() {
        notifier.addSpecifiedListener(
            notifier.types.SHOULD_REFRESH_TOKENS,
            this.refreshData,
        );
    }

    private get vpnInfo(): VpnExtensionInfoInterface | null {
        return this.state.vpnInfo;
    }

    private set vpnInfo(vpnInfo: VpnExtensionInfoInterface | null) {
        this.state.vpnInfo = vpnInfo;
        sessionState.setItem(StorageKey.Endpoints, this.state);
    }

    /**
     * Reconnects to the new endpoint
     * @param endpoint
     * @param location
     */
    reconnectEndpoint = async (
        endpoint: EndpointInterface,
        location: LocationInterface,
    ): Promise<void> => {
        const { domainName } = await proxy.setCurrentEndpoint(endpoint, location);
        const { credentialsHash, token } = await credentials.getAccessCredentials();
        await connectivity.endpointConnectivity.setCredentials(domainName, token, credentialsHash);
        await locationsService.setSelectedLocation(location.id);
        log.debug(`Reconnecting endpoint to ${endpoint.id}`);
    };

    /**
     * Returns closest endpoint, firstly checking if locations object includes
     * endpoint with same city name
     * @param locations - locations list
     * @param targetLocation
     */
    getClosestLocation = (
        locations: LocationInterface[],
        targetLocation: LocationInterface,
    ): LocationInterface => {
        const sameCityEndpoint = locations.find((endpoint) => {
            return endpoint.cityName === targetLocation.cityName;
        });

        if (sameCityEndpoint) {
            return sameCityEndpoint;
        }

        return getLocationWithLowestPing(locations);
    };

    /**
     * Updates selected location and reconnect to endpoint if it was updated as well
     */
    async updateSelectedLocation(): Promise<void> {
        const updatedLocation = locationsService.updateSelectedLocation();
        // reconnect to endpoint if selected location was updated
        if (isVPNConnected() && updatedLocation?.endpoint) {
            await this.reconnectEndpoint(updatedLocation.endpoint, updatedLocation);
        }
    }

    /**
     * Gets endpoints remotely and updates them if there were no errors
     */
    getLocationsFromServer = async (): Promise<LocationInterface[] | null> => {
        let vpnToken;

        try {
            vpnToken = await credentials.gainValidVpnToken();
        } catch (e) {
            log.debug('Unable to get endpoints token because: ', e.message);
            return null;
        }

        const appId = await credentials.getAppId();
        const locations = await locationsService.getLocationsFromServer(appId, vpnToken.token);
        await this.updateSelectedLocation();
        return locations;
    };

    vpnTokenChanged = (oldVpnToken: VpnTokenData, newVpnToken: VpnTokenData): boolean => {
        if (!oldVpnToken || !newVpnToken) {
            return false;
        }
        return oldVpnToken.licenseKey !== newVpnToken.licenseKey;
    };

    /**
     * Updates vpn tokens and credentials
     */
    refreshTokens = async (): Promise<{
        vpnToken: VpnTokenData,
        vpnCredentials: CredentialsDataInterface,
    }> => {
        log.info('Refreshing tokens');
        const vpnToken = await credentials.gainValidVpnToken(true, false);
        const vpnCredentials = await credentials.gainValidVpnCredentials(true, false);
        log.info('Tokens and credentials refreshed successfully');
        return { vpnToken, vpnCredentials };
    };

    /**
     * This method is called when refresh token message received
     * 1. Update vpnToken
     * 2. Update vpnCredentials
     * 3. Update vpnInfo
     * 4. Check if user didn't get over traffic limits
     */
    refreshData = async (): Promise<void> => {
        try {
            const appId = await credentials.getAppId();
            const { vpnToken } = await this.refreshTokens();
            const vpnInfo = await vpnProvider.getVpnExtensionInfo(appId, vpnToken.token);
            await this.updateLocations(true);
            this.vpnInfo = vpnInfo;
        } catch (e) {
            log.debug(e.message);
        }
    };

    /**
     * Returns list of locations which fit to token
     * @param locations
     * @param isPremiumToken
     */
    filterLocationsMatchingToken = (
        locations: LocationInterface[],
        isPremiumToken: boolean,
    ): LocationInterface[] => {
        const filteredLocations = locations.filter((location) => {
            if (isPremiumToken) {
                return true;
            }
            return location.premiumOnly === false;
        });

        return filteredLocations;
    };

    updateEndpointsExclusions = async (locations: LocationInterface[]): Promise<void> => {
        const endpoints = flattenDeep(locations.map((location) => {
            return location.endpoints;
        }));

        const domainNames = endpoints.map((endpoint) => endpoint.domainName);
        const topLevelDomains = domainNames.map((domainName) => getDomain(domainName));
        const uniqTopLevelDomains = uniq(topLevelDomains);
        const nonNullTopLevelDomains = uniqTopLevelDomains.filter((domain): domain is string => {
            return domain !== null;
        });

        await endpointsTldExclusions.addEndpointsTldExclusions(nonNullTopLevelDomains);
    };

    /**
     * Updates locations list
     * @param shouldReconnect
     */
    updateLocations = async (shouldReconnect = false): Promise<void> => {
        const locations = await this.getLocationsFromServer();

        if (!locations || isEmpty(locations)) {
            return;
        }

        // check endpoints top level domains and add them to the exclusions if necessary
        this.updateEndpointsExclusions(locations);

        const currentLocation = await locationsService.getSelectedLocation();
        const isPremiumToken = await credentials.isPremiumToken();

        const doesLocationFitToken = isPremiumToken || currentLocation?.premiumOnly === false;

        if (!doesLocationFitToken && currentLocation) {
            const filteredLocations = this.filterLocationsMatchingToken(locations, isPremiumToken);
            const closestLocation = this.getClosestLocation(filteredLocations, currentLocation);
            try {
                // eslint-disable-next-line max-len
                const closestEndpoint = await locationsService.getEndpointByLocation(closestLocation);
                if (!closestEndpoint) {
                    return;
                }
                await this.reconnectEndpoint(closestEndpoint, closestLocation);
            } catch (e) {
                log.debug(e);
            }
            return;
        }

        if (!shouldReconnect) {
            return;
        }

        if (currentLocation) {
            // Check if current endpoint is in the list of received locations
            // if not we should get closest and reconnect
            const endpoint = await locationsService.getEndpointByLocation(currentLocation);
            if (endpoint) {
                await this.reconnectEndpoint(endpoint, currentLocation);
            } else {
                const locationsMatchingToken = this.filterLocationsMatchingToken(
                    locations,
                    isPremiumToken,
                );
                const closestLocation = this.getClosestLocation(
                    locationsMatchingToken,
                    currentLocation,
                );
                // eslint-disable-next-line max-len
                const closestEndpoint = await locationsService.getEndpointByLocation(closestLocation);
                if (!closestEndpoint) {
                    return;
                }
                await this.reconnectEndpoint(closestEndpoint, closestLocation);
            }
        } else {
            log.debug('Was unable to find current location');
        }
    };

    getVpnInfoRemotely = async (): Promise<VpnExtensionInfoInterface | null> => {
        let vpnToken;

        try {
            vpnToken = await credentials.gainValidVpnToken();
        } catch (e) {
            log.debug('Unable to get endpoints info because: ', e.message);
            return null;
        }
        const appId = await credentials.getAppId();
        let vpnInfo = await vpnProvider.getVpnExtensionInfo(appId, vpnToken.token);
        let shouldReconnect = false;

        if (vpnInfo.refreshTokens) {
            let updatedVpnToken;

            try {
                ({ vpnToken: updatedVpnToken } = await this.refreshTokens());
            } catch (e) {
                log.debug('Unable to refresh tokens');
                return null;
            }

            if (this.vpnTokenChanged(vpnToken, updatedVpnToken)) {
                shouldReconnect = true;
            }

            vpnInfo = await vpnProvider.getVpnExtensionInfo(appId, updatedVpnToken.token);
        }

        await this.updateLocations(shouldReconnect);

        // Save vpn info in the memory
        this.vpnInfo = vpnInfo;

        // update vpn info on popup
        notifier.notifyListeners(notifier.types.VPN_INFO_UPDATED, this.vpnInfo);

        return this.vpnInfo;
    };

    /**
     * Returns vpn info cached value and launches remote vpn info getting
     */
    getVpnInfo = async (): Promise<VpnExtensionInfoInterface | null> => {
        if (this.vpnInfo) {
            // no await here in order to return cached vpnInfo
            // and launch function with promise execution
            this.getVpnInfoRemotely().catch((e) => {
                log.debug(e);
            });
            return this.vpnInfo;
        }

        let vpnInfo;
        try {
            vpnInfo = await this.getVpnInfoRemotely();
        } catch (e) {
            log.error(e);
        }

        if (!vpnInfo) {
            return null;
        }

        this.vpnInfo = vpnInfo;

        return this.vpnInfo;
    };

    getLocations = (): LocationWithPing[] => {
        const locations = locationsService.getLocationsWithPing();
        return locations;
    };

    getSelectedLocation = async (): Promise<LocationWithPing | null> => {
        const selectedLocation = await locationsService.getSelectedLocation();
        const isVPNDisabled = isVPNDisconnectedIdle();
        const doesUserPreferFastestLocation = settings.getQuickConnectSetting() === QuickConnectSetting.FastestLocation;

        // If there is no selected location or user prefers the fastest location and vpn is disabled
        // we find the fastest location
        const shouldSelectFasterLocation = !selectedLocation
            || (doesUserPreferFastestLocation && isVPNDisabled);

        if (!shouldSelectFasterLocation) {
            return new LocationWithPing(<LocationWithPing>selectedLocation);
        }

        const locations = locationsService.getLocations();

        if (isEmpty(locations)) {
            return null;
        }

        const isPremiumUser = await credentials.isPremiumToken();

        let filteredLocations = locations;
        if (!isPremiumUser) {
            filteredLocations = locations.filter((location) => {
                return !location.premiumOnly;
            });
        }

        const pingsCalculated = filteredLocations.every((location) => {
            return (location.available
                && location.ping && location.ping > 0) || !location.available;
        });

        const PINGS_WAIT_TIMEOUT_MS = 1000;

        // not ready yet to determine default location
        if (!pingsCalculated && isMeasuringPingInProgress()) {
            await sleep(PINGS_WAIT_TIMEOUT_MS);
        }

        const fastestLocation = getLocationWithLowestPing(filteredLocations);

        if (!fastestLocation) {
            return null;
        }

        await locationsService.setSelectedLocation(fastestLocation.id);
        return new LocationWithPing(fastestLocation);
    };

    getVpnFailurePage = async (): Promise<string> => {
        let vpnToken;
        try {
            vpnToken = await credentials.gainValidVpnToken();
        } catch (e) {
            log.error('Unable to get valid endpoints token. Error: ', e.message);
        }

        // undefined values will be omitted in the querystring
        const token = vpnToken?.token || undefined;

        const appId = await credentials.getAppId();

        // if no endpoints info, then get endpoints failure url with empty token
        let appendToQueryString = false;
        if (!this.vpnInfo) {
            try {
                if (!token) {
                    throw new Error('No token provided');
                }
                this.vpnInfo = await vpnProvider.getVpnExtensionInfo(appId, token);
            } catch (e) {
                this.vpnInfo = {
                    vpnFailurePage: POPUP_DEFAULT_SUPPORT_URL,
                    bandwidthFreeMbits: 0,
                    premiumPromoPage: '',
                    premiumPromoEnabled: false,
                    refreshTokens: false,
                    usedDownloadedBytes: 0,
                    usedUploadedBytes: 0,
                    maxDownloadedBytes: 0,
                    maxUploadedBytes: 0,
                    renewalTrafficDate: '',
                    maxDevicesCount: 0,
                    emailConfirmationRequired: false,
                };
                appendToQueryString = true;
            }
        }

        const vpnFailurePage = this.vpnInfo && this.vpnInfo.vpnFailurePage;

        const queryString = qs.stringify({ token, app_id: appId });

        const separator = appendToQueryString ? '&' : '?';

        return `${vpnFailurePage}${separator}${queryString}`;
    };

    clearVpnInfo(): void {
        this.vpnInfo = null;
    }

    init(): void {
        this.state = sessionState.getItem(StorageKey.Endpoints);
        // Clear vpn info on deauthentication in order to set correct vpn info after next login
        notifier.addSpecifiedListener(
            notifier.types.USER_DEAUTHENTICATED,
            this.clearVpnInfo.bind(this),
        );
        // start getting vpn info and endpoints
        this.getVpnInfo();
    }
}

const endpoints = new Endpoints();

export default endpoints;
