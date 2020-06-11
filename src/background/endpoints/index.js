import _ from 'lodash';
import qs from 'qs';
import log from '../../lib/logger';
import { getClosestLocationToTarget } from '../../lib/helpers';
import { ERROR_STATUSES } from '../../lib/constants';
import { POPUP_DEFAULT_SUPPORT_URL } from '../config';
import notifier from '../../lib/notifier';
import settings from '../settings/settings';
import notifications from '../notifications';
import connectivity from '../connectivity';
import credentials from '../credentials';
import proxy from '../proxy';
import vpnProvider from '../providers/vpnProvider';
import userLocation from './userLocation';
import { locationsService } from './locationsService';
import { LocationWithPing } from './LocationWithPing';

/**
 * Endpoint information
 * @typedef {Object} Endpoint
 * @property {string} id
 * @property {string} cityName
 * @property {string} countryCode
 * @property {string} countryName
 * @property {string} domainName
 * @property {[number, number]} coordinates
 * @property {boolean} premiumOnly
 * @property {string} publicKey
 */

/**
 * Endpoints manages endpoints, vpn, current location information.
 */
class Endpoints {
    vpnInfo = null;

    constructor() {
        notifier.addSpecifiedListener(
            notifier.types.SHOULD_REFRESH_TOKENS,
            this.handleRefreshTokenEvent
        );
    }

    /**
     * Reconnects to the new endpoint
     * @param {Endpoint} endpoint
     * @param {Location} location
     * @returns {Promise<void>}
     */
    reconnectEndpoint = async (endpoint, location) => {
        const { domainName } = await proxy.setCurrentEndpoint(endpoint, location);
        const { credentialsHash, token } = await credentials.getAccessCredentials();
        await connectivity.endpointConnectivity.setCredentials(domainName, token, credentialsHash);
        log.debug(`Reconnecting endpoint to ${endpoint.id}`);
    };

    /**
     * Returns closest endpoint, firstly checking if locations object includes
     * endpoint with same city name
     * @param {Location[]} locations - locations list
     * @param {Location} targetLocation
     * @returns {Location}
     */
    getClosestLocation = (locations, targetLocation) => {
        const sameCityEndpoint = locations.find((endpoint) => {
            return endpoint.cityName === targetLocation.cityName;
        });

        if (sameCityEndpoint) {
            return sameCityEndpoint;
        }

        return getClosestLocationToTarget(locations, targetLocation);
    };

    /**
     * Gets endpoints remotely and updates them if there were no errors
     * @returns {Promise<null|*>}
     */
    getLocationsFromServer = async () => {
        let vpnToken;

        try {
            vpnToken = await credentials.gainValidVpnToken();
        } catch (e) {
            log.debug('Unable to get endpoints token because: ', e.message);
            return null;
        }

        return locationsService.getLocationsFromServer(vpnToken.token);
    };

    vpnTokenChanged = (oldVpnToken, newVpnToken) => {
        if (!oldVpnToken || !newVpnToken) {
            return false;
        }
        return oldVpnToken.licenseKey !== newVpnToken.licenseKey;
    };

    /**
     * Updates vpn tokens and credentials
     * @returns {Promise<{vpnToken: *, vpnCredentials: *}>}
     */
    refreshTokens = async () => {
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
     * @returns {Promise<void>}
     */
    handleRefreshTokenEvent = async () => {
        try {
            const { vpnToken } = await this.refreshTokens();
            const vpnInfo = await vpnProvider.getVpnExtensionInfo(vpnToken.token);
            await this.updateLocations(true);
            this.vpnInfo = vpnInfo;
        } catch (e) {
            if (e.status === ERROR_STATUSES.LIMIT_EXCEEDED) {
                // Disable proxy
                await settings.disableProxy();
                // Notify icon to change
                notifier.notifyListeners(notifier.types.UPDATE_BROWSER_ACTION_ICON);
                // Send notification
                await notifications.create({ message: 'Oops! Monthly data limit reached' });
            }
            log.debug(e.message);
        }
    };

    /**
     * Updates endpoints list
     * @param shouldReconnect
     * @returns {Promise<void>}
     */
    updateLocations = async (shouldReconnect = false) => {
        const locations = await this.getLocationsFromServer();

        if (!locations || _.isEmpty(locations)) {
            return;
        }

        if (!shouldReconnect) {
            return;
        }

        const currentEndpoint = await proxy.getCurrentEndpoint();
        const currentLocation = await locationsService.getSelectedLocation()
            || await locationsService.getLocationByEndpoint(currentEndpoint?.id);

        if (currentLocation) {
            // Check if current endpoint is in the list of received locations
            // if not we should get closest and reconnect
            const endpoint = await locationsService.getEndpoint(currentLocation);
            if (endpoint) {
                await this.reconnectEndpoint(endpoint, currentLocation);
            } else {
                const closestLocation = this.getClosestLocation(locations, currentLocation);
                const closestEndpoint = await locationsService.getEndpoint(closestLocation);
                await this.reconnectEndpoint(closestEndpoint, currentLocation);
            }
        } else {
            log.debug('Was unable to find current location');
        }
    }

    getVpnInfoRemotely = async () => {
        let vpnToken;

        try {
            vpnToken = await credentials.gainValidVpnToken();
        } catch (e) {
            log.debug('Unable to get endpoints info because: ', e.message);
            return;
        }

        let vpnInfo = await vpnProvider.getVpnExtensionInfo(vpnToken.token);
        let shouldReconnect = false;

        if (vpnInfo.refreshTokens) {
            let updatedVpnToken;

            try {
                ({ vpnToken: updatedVpnToken } = await this.refreshTokens());
            } catch (e) {
                log.debug('Unable to refresh tokens');
                return;
            }

            if (this.vpnTokenChanged(vpnToken, updatedVpnToken)) {
                shouldReconnect = true;
            }

            vpnInfo = await vpnProvider.getVpnExtensionInfo(updatedVpnToken.token);
        }

        await this.updateLocations(shouldReconnect);

        // Save vpn info in the memory
        this.vpnInfo = vpnInfo;

        // update vpn info on popup
        notifier.notifyListeners(notifier.types.VPN_INFO_UPDATED, this.vpnInfo);
    };

    /**
     * Returns vpn info cached value and launches remote vpn info getting
     * @param local flag if check only for local data
     * @returns vpnInfo or null
     */
    getVpnInfo = (local = false) => {
        if (!local) {
            this.getVpnInfoRemotely();
        }

        if (this.vpnInfo) {
            return this.vpnInfo;
        }
        return null;
    };

    getLocations = () => {
        const locations = locationsService.getLocationsWithPing();
        return locations;
    }

    getSelectedLocation = async () => {
        const proxySelectedEndpoint = await proxy.getCurrentEndpoint();
        const selectedLocation = locationsService.getLocationByEndpoint(proxySelectedEndpoint?.id);

        // if found return
        if (selectedLocation) {
            return new LocationWithPing(selectedLocation);
        }

        const userCurrentLocation = await userLocation.getCurrentLocation();
        const locations = locationsService.getLocations();

        if (!userCurrentLocation || _.isEmpty(locations)) {
            return null;
        }

        const closestLocation = getClosestLocationToTarget(
            locations,
            userCurrentLocation
        );

        const endpoint = await locationsService.getEndpoint(closestLocation);
        await this.reconnectEndpoint(endpoint, new LocationWithPing(closestLocation));

        return new LocationWithPing(closestLocation);
    };

    getVpnFailurePage = async () => {
        let vpnToken;
        try {
            vpnToken = await credentials.gainValidVpnToken();
        } catch (e) {
            log.error('Unable to get valid endpoints token. Error: ', e.message);
        }

        // undefined values will be omitted in the querystring
        const token = vpnToken.token || undefined;

        // if no endpoints info, then get endpoints failure url with empty token
        let appendToQueryString = false;
        if (!this.vpnInfo) {
            try {
                this.vpnInfo = await vpnProvider.getVpnExtensionInfo(token);
            } catch (e) {
                this.vpnInfo = { vpnFailurePage: POPUP_DEFAULT_SUPPORT_URL };
                appendToQueryString = true;
            }
        }

        const vpnFailurePage = this.vpnInfo && this.vpnInfo.vpnFailurePage;
        const appId = credentials.getAppId();

        const queryString = qs.stringify({ token, app_id: appId });

        const separator = appendToQueryString ? '&' : '?';

        return `${vpnFailurePage}${separator}${queryString}`;
    };

    init() {
        // start getting vpn info and endpoints
        this.getVpnInfo();
    }
}

const endpoints = new Endpoints();

export default endpoints;
