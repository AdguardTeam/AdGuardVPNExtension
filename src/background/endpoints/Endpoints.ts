import flattenDeep from 'lodash/flattenDeep';
import uniq from 'lodash/uniq';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs';
import { getDomain } from 'tldts';

import { log } from '../../common/logger';
import { getForwarderUrl, getLocationWithLowestPing } from '../../common/helpers';
import { notifier } from '../../common/notifier';
import { proxy } from '../proxy';
import { vpnProvider } from '../providers/vpnProvider';
import { endpointsTldExclusions } from '../proxy/endpointsTldExclusions';
// eslint-disable-next-line import/no-cycle
import { connectivity } from '../connectivity';
import { credentials } from '../credentials';
import { connectivityService } from '../connectivity/connectivityService';
import {
    type EndpointInterface,
    type VpnTokenData,
    type CredentialsDataInterface,
    type LocationInterface,
    StorageKey,
} from '../schema';
import type { VpnExtensionInfoInterface } from '../../common/schema/endpoints/vpnInfo';
import { settings } from '../settings';
import { QuickConnectSetting } from '../../common/constants';
import { forwarder } from '../forwarder';
import { FORWARDER_URL_QUERIES } from '../config';
import { StateData } from '../stateStorage';

import { locationsService } from './locationsService';
import { LocationDto } from './LocationDto';
import { type Location } from './Location';

// FIXME do we still need this? since we are using typescript
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
    getSelectedLocation(): Promise<LocationDto | null>;
    getLocations(): Promise<LocationDto[]>;
    getLocationsFromServer(): Promise<Location[] | null>
    getVpnFailurePage(): Promise<string>;
    init(): Promise<void>;
}

/**
 * Endpoints manages endpoints, vpn, current location information.
 */
class Endpoints implements EndpointsInterface {
    /**
     * Endpoints service state data.
     * Used to save and retrieve endpoints state from session storage,
     * in order to persist it across service worker restarts.
     */
    private endpointsState = new StateData(StorageKey.Endpoints);

    constructor() {
        this.refreshData = this.refreshData.bind(this);
        this.clearVpnInfo = this.clearVpnInfo.bind(this);
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
        log.debug(`[vpn.Endpoints]: Reconnecting endpoint to ${endpoint.id}`);
    };

    /**
     * Endpoint with same city name.
     * @param locations - locations list
     * @param targetLocation
     *
     * @returns Closest endpoint, firstly checking if locations object includes endpoint with same city name.
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
        const updatedLocation = await locationsService.updateSelectedLocation();
        // reconnect to endpoint if selected location was updated
        if (connectivityService.isVPNConnected() && updatedLocation?.endpoint) {
            await this.reconnectEndpoint(updatedLocation.endpoint, updatedLocation);
        }
    }

    /**
     * Gets endpoints remotely and updates them if there were no errors
     *
     * @returns Promise with locations list or null if there were errors.
     */
    getLocationsFromServer = async (): Promise<Location[] | null> => {
        let vpnToken;

        try {
            vpnToken = await credentials.gainValidVpnToken();
        } catch (e) {
            log.debug('[vpn.Endpoints]: Unable to get endpoints token because: ', e.message);
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
     *
     * @returns Promise with vpn token and credentials.
     */
    refreshTokens = async (): Promise<{
        vpnToken: VpnTokenData,
        vpnCredentials: CredentialsDataInterface,
    }> => {
        log.info('[vpn.Endpoints]: Refreshing tokens');
        const vpnToken = await credentials.gainValidVpnToken(true, false);
        const vpnCredentials = await credentials.gainValidVpnCredentials(true, false);
        log.info('[vpn.Endpoints]: Tokens and credentials refreshed successfully');
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
            await this.endpointsState.update({ vpnInfo });
        } catch (e) {
            log.debug('[vpn.Endpoints]: ', e.message);
        }
    };

    /**
     * Filters locations based on token type (premium or free).
     *
     * @param locations
     * @param isPremiumToken
     *
     * @returns List of locations which fit to token.
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
        await this.updateEndpointsExclusions(locations);

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
                log.debug('[vpn.Endpoints]: ', e);
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
            log.debug('[vpn.Endpoints]: Was unable to find current location');
        }
    };

    getVpnInfoRemotely = async (): Promise<VpnExtensionInfoInterface | null> => {
        let vpnToken;

        try {
            vpnToken = await credentials.gainValidVpnToken();
        } catch (e) {
            log.debug('[vpn.Endpoints]: Unable to get endpoints info because: ', e.message);
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
                log.debug('[vpn.Endpoints]: Unable to refresh tokens');
                return null;
            }

            if (this.vpnTokenChanged(vpnToken, updatedVpnToken)) {
                shouldReconnect = true;
            }

            vpnInfo = await vpnProvider.getVpnExtensionInfo(appId, updatedVpnToken.token);
        }

        await this.updateLocations(shouldReconnect);

        // Save vpn info in the memory
        await this.endpointsState.update({ vpnInfo });

        // update vpn info on popup
        notifier.notifyListeners(notifier.types.VPN_INFO_UPDATED, vpnInfo);

        return vpnInfo;
    };

    /**
     * Returns vpn info cached value and launches remote vpn info getting.
     *
     * Note: If the service worker is woken up by a popup click,
     * this method can be called before the service is initialized.
     *
     * @returns Cached vpn info or `null` if there was an error.
     */
    getVpnInfo = async (): Promise<VpnExtensionInfoInterface | null> => {
        const { vpnInfo } = await this.endpointsState.get();

        // We check isInit first, because the vpnInfo getter
        // will throw an error if the service is not initialized.
        if (vpnInfo) {
            // no await here in order to return cached vpnInfo
            // and launch function with promise execution
            this.getVpnInfoRemotely().catch((e) => {
                log.debug('[vpn.Endpoints]: ', e);
            });
            return vpnInfo;
        }

        let remoteVpnInfo: VpnExtensionInfoInterface | null | undefined;

        try {
            remoteVpnInfo = await this.getVpnInfoRemotely();
        } catch (e) {
            log.error('[vpn.Endpoints]: ', e);
        }

        if (!remoteVpnInfo) {
            return null;
        }

        await this.endpointsState.update({ vpnInfo: remoteVpnInfo });

        return remoteVpnInfo;
    };

    // FIXME jsdoc
    getLocations = async (): Promise<LocationDto[]> => {
        const locations = await locationsService.getLocationDtos();
        return locations;
    };

    // FIXME jsdoc
    getSelectedLocation = async (): Promise<LocationDto | null> => {
        const selectedLocation = await locationsService.getSelectedLocation();
        const isVPNDisabled = connectivityService.isVPNDisconnectedIdle() || connectivityService.isVPNIdle();
        const doesUserPreferFastestLocation = settings.getQuickConnectSetting() === QuickConnectSetting.FastestLocation;

        // If there is no selected location or user prefers the fastest location and vpn is disabled
        // we find the fastest location
        const shouldSelectFasterLocation = !selectedLocation
            || (doesUserPreferFastestLocation && isVPNDisabled);

        if (!shouldSelectFasterLocation) {
            return new LocationDto(selectedLocation);
        }

        const locations = await locationsService.getLocations();

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

        // AG-49612: Backend provides pings pre-calculated, no need to wait for local measurement
        const fastestLocation = getLocationWithLowestPing(filteredLocations);

        if (!fastestLocation) {
            return null;
        }

        await locationsService.setSelectedLocation(fastestLocation.id);
        return new LocationDto(fastestLocation);
    };

    getVpnFailurePage = async (): Promise<string> => {
        let vpnToken;
        try {
            vpnToken = await credentials.gainValidVpnToken();
        } catch (e) {
            log.error('[vpn.Endpoints]: Unable to get valid endpoints token. Error: ', e.message);
        }

        // undefined values will be omitted in the querystring
        const token = vpnToken?.token || undefined;

        const appId = await credentials.getAppId();

        const forwarderDomain = await forwarder.updateAndGetDomain();

        // if no endpoints info, then get endpoints failure url with empty token
        let appendToQueryString = false;

        let { vpnInfo } = await this.endpointsState.get();
        if (!vpnInfo) {
            try {
                if (!token) {
                    throw new Error('No token provided');
                }
                vpnInfo = await vpnProvider.getVpnExtensionInfo(appId, token);
            } catch (e) {
                vpnInfo = {
                    vpnFailurePage: getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.POPUP_DEFAULT_SUPPORT),
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

            await this.endpointsState.update({ vpnInfo });
        }

        const vpnFailurePage = vpnInfo && vpnInfo.vpnFailurePage;

        const queryString = qs.stringify({ token, app_id: appId });

        const separator = appendToQueryString ? '&' : '?';

        return `${vpnFailurePage}${separator}${queryString}`;
    };

    async clearVpnInfo(): Promise<void> {
        await this.endpointsState.update({ vpnInfo: null });
    }

    async init(): Promise<void> {
        notifier.addSpecifiedListener(
            notifier.types.SHOULD_REFRESH_TOKENS,
            this.refreshData,
        );

        // Clear vpn info on deauthentication in order to set correct vpn info after next login
        notifier.addSpecifiedListener(
            notifier.types.USER_DEAUTHENTICATED,
            this.clearVpnInfo,
        );

        const { vpnInfo } = await this.endpointsState.get();
        if (!vpnInfo) {
            // start getting vpn info and endpoints
            this.getVpnInfo();
        }
    }
}

const endpoints = new Endpoints();

export default endpoints;
