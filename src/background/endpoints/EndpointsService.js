import isEqual from 'lodash/isEqual';
import _ from 'lodash';
import qs from 'qs';
import log from '../../lib/logger';
import { getClosestEndpointByCoordinates } from '../../lib/helpers';
import { MESSAGES_TYPES } from '../../lib/constants';
import { POPUP_DEFAULT_SUPPORT_URL } from '../config';
import EndpointsManager from './EndpointsManager';
import notifier from '../../lib/notifier';
import settings from '../settings/settings';
import notifications from '../notifications';

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
 * EndpointsService manages endpoints, vpn, current location information.
 */
class EndpointsService {
    vpnInfo = null;

    currentLocation = null;

    constructor({
        browserApi, proxy, credentials, connectivity, vpnProvider,
    }) {
        this.browserApi = browserApi;
        this.proxy = proxy;
        this.credentials = credentials;
        this.connectivity = connectivity;
        this.vpnProvider = vpnProvider;
        this.endpointsManager = new EndpointsManager(browserApi, connectivity);

        notifier.addSpecifiedListener(
            notifier.types.SHOULD_REFRESH_TOKENS,
            this.handleRefreshTokens
        );
    }

    /**
     * Reconnects to the new endpoint
     * @param {Endpoint} endpoint
     * @returns {Promise<void>}
     */
    reconnectEndpoint = async (endpoint) => {
        const { domainName } = await this.proxy.setCurrentEndpoint(endpoint);
        const { prefix, token } = await this.credentials.getAccessCredentials();
        const wsHost = `${prefix}.${domainName}`;
        await this.connectivity.endpointConnectivity.setCredentials(wsHost, domainName, token);
        log.debug(`Reconnect endpoint from ${endpoint.id} to same city ${endpoint.id}`);
    };


    /**
     * Returns closest endpoint, firstly checking if endpoints object includes
     * endpoint with same city name
     * @param {Object.<Endpoint>} endpoints - endpoints stored by endpoint id
     * @param {Endpoint} currentEndpoint
     * @returns {Endpoint}
     */
    getClosestEndpoint = (endpoints, currentEndpoint) => {
        const endpointsArr = Object.values(endpoints);

        const sameCityEndpoint = endpointsArr.find((endpoint) => {
            return endpoint.cityName === currentEndpoint.cityName;
        });

        if (sameCityEndpoint) {
            return sameCityEndpoint;
        }

        return getClosestEndpointByCoordinates(currentEndpoint, endpointsArr);
    };

    /**
     * Gets endpoints remotely and updates them if there were no errors
     * @returns {Promise<null|*>}
     */
    getEndpointsRemotely = async () => {
        let vpnToken;

        try {
            vpnToken = await this.credentials.gainValidVpnToken();
        } catch (e) {
            log.debug('Unable to get endpoints token because: ', e.message);
            return null;
        }

        const newEndpoints = await this.vpnProvider.getEndpoints(vpnToken.token);

        if (newEndpoints) {
            this.endpointsManager.setEndpoints(newEndpoints);
        }

        return newEndpoints;
    };

    vpnTokenChanged = (oldVpnToken, newVpnToken) => {
        return oldVpnToken.licenseKey !== newVpnToken.licenseKey;
    };

    /**
     * Updates vpn tokens and credentials
     * @returns {Promise<{vpnToken: *, vpnCredentials: *}>}
     */
    refreshTokens = async () => {
        log.info('Refreshing tokens');
        const vpnToken = await this.credentials.gainValidVpnToken(true, false);
        const vpnCredentials = await this.credentials.gainValidVpnCredentials(true, false);
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
    handleRefreshTokens = async () => {
        const { vpnToken } = await this.refreshTokens();
        const vpnInfo = await this.vpnProvider.getVpnExtensionInfo(vpnToken.token);

        // Check traffic limits
        const overTrafficLimits = this.isOverTrafficLimits(vpnInfo);
        if (overTrafficLimits) {
            // Turns off proxy if user over reaches traffic limits
            await settings.disableProxy();
            // Notify icon to change
            notifier.notifyListeners(notifier.types.TRAFFIC_OVER_LIMIT);
            // Send notification
            await notifications.create({ message: 'Oops! Monthly data limit reached' });
        }

        await this.updateEndpoints(true);

        this.vpnInfo = {
            ...vpnInfo,
            overTrafficLimits,
        };
    };

    /**
     * Checks if user has reached monthly traffic limit
     * @param vpnInfo
     * @returns {boolean}
     */
    isOverTrafficLimits = (vpnInfo) => {
        const {
            usedDownloadedBytes,
            usedUploadedBytes,
            maxDownloadedBytes,
            maxUploadedBytes,
        } = vpnInfo;

        if (usedDownloadedBytes > maxDownloadedBytes && maxDownloadedBytes !== 0) {
            return true;
        }

        if (maxUploadedBytes !== 0 && usedUploadedBytes > maxUploadedBytes) {
            return true;
        }

        return false;
    };

    /**
     * Updates endpoints list
     * @param shouldReconnect
     * @returns {Promise<void>}
     */
    updateEndpoints = async (shouldReconnect = false) => {
        const endpoints = await this.getEndpointsRemotely();

        if (!endpoints || _.isEmpty(endpoints)) {
            return;
        }

        if (!shouldReconnect) {
            return;
        }

        const currentEndpoint = await this.proxy.getCurrentEndpoint();

        if (currentEndpoint) {
            // Check if current endpoint is in the list of received endpoints
            // if not we should get closest and reconnect
            const endpointsHaveCurrentEndpoint = Object.keys(endpoints)
                .find((endpointId) => endpointId === currentEndpoint.id);
            if (!endpointsHaveCurrentEndpoint) {
                const closestEndpoint = this.getClosestEndpoint(endpoints, currentEndpoint);
                await this.reconnectEndpoint(closestEndpoint);
            }
        } else {
            const closestEndpoint = this.getClosestEndpoint(endpoints, currentEndpoint);
            await this.reconnectEndpoint(closestEndpoint);
        }
    }

    getVpnInfoRemotely = async () => {
        let vpnToken;

        try {
            vpnToken = await this.credentials.gainValidVpnToken();
        } catch (e) {
            log.debug('Unable to get endpoints info because: ', e.message);
            return;
        }

        let vpnInfo = await this.vpnProvider.getVpnExtensionInfo(vpnToken.token);
        let shouldReconnect = false;

        if (vpnInfo.refreshTokens) {
            let updatedVpnToken;

            try {
                ({ vpnToken: updatedVpnToken } = await this.refreshTokens());
            } catch (e) {
                log.debug('Unable to refresh tokens');
            }

            if (this.vpnTokenChanged(vpnToken, updatedVpnToken)) {
                shouldReconnect = true;
            }

            vpnInfo = await this.vpnProvider.getVpnExtensionInfo(updatedVpnToken.token);
        }

        // Turns off proxy if user is over traffic limits
        const overTrafficLimits = this.isOverTrafficLimits(vpnInfo);
        if (overTrafficLimits) {
            const disabled = await settings.disableProxy();
            if (disabled) {
                log.debug('Proxy was disabled because of traffic limits');
            }
            notifier.notifyListeners(notifier.types.TRAFFIC_OVER_LIMIT);
        } else {
            notifier.notifyListeners(notifier.types.TRAFFIC_OVER_LIMIT);
        }

        await this.updateEndpoints(shouldReconnect);

        // Save vpn info in the memory
        this.vpnInfo = {
            ...vpnInfo,
            overTrafficLimits,
        };

        await this.browserApi.runtime.sendMessage({
            type: MESSAGES_TYPES.VPN_INFO_UPDATED,
            data: this.vpnInfo,
        });
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

    getEndpoints = () => {
        const currentEndpoint = this.proxy.getCurrentEndpoint();
        const currentEndpointPing = this.connectivity.endpointConnectivity.getPing();
        return this.endpointsManager.getEndpoints(currentEndpoint, currentEndpointPing);
    };

    getCurrentLocationRemote = async () => {
        const MIDDLE_OF_EUROPE = { coordinates: [51.05, 13.73] }; // Chosen approximately
        let currentLocation;
        try {
            currentLocation = await this.vpnProvider.getCurrentLocation();
        } catch (e) {
            log.error(e.message);
        }

        // if current location wasn't received use predefined
        currentLocation = currentLocation || MIDDLE_OF_EUROPE;

        if (!isEqual(this.currentLocation, currentLocation)) {
            this.currentLocation = currentLocation;
        }

        return currentLocation;
    };

    getCurrentLocation = () => {
        // update current location information in background
        this.getCurrentLocationRemote();
        if (this.currentLocation) {
            return this.currentLocation;
        }
        return null;
    };

    getSelectedEndpoint = async () => {
        const proxySelectedEndpoint = await this.proxy.getCurrentEndpoint();

        // if found return
        if (proxySelectedEndpoint) {
            return proxySelectedEndpoint;
        }

        const currentLocation = this.getCurrentLocation();
        const endpoints = Object.values(this.endpointsManager.getAll());

        if (!currentLocation || _.isEmpty(endpoints)) {
            return null;
        }

        const closestEndpoint = getClosestEndpointByCoordinates(
            currentLocation,
            endpoints
        );

        await this.proxy.setCurrentEndpoint(closestEndpoint);
        return closestEndpoint;
    };

    getVpnFailurePage = async () => {
        let vpnToken;
        try {
            vpnToken = await this.credentials.gainValidVpnToken();
        } catch (e) {
            log.error('Unable to get valid endpoints token. Error: ', e.message);
        }

        // undefined values will be omitted in the querystring
        const token = vpnToken.token || undefined;

        // if no endpoints info, then get endpoints failure url with empty token
        let appendToQueryString = false;
        if (!this.vpnInfo) {
            try {
                this.vpnInfo = await this.vpnProvider.getVpnExtensionInfo(token);
            } catch (e) {
                this.vpnInfo = { vpnFailurePage: POPUP_DEFAULT_SUPPORT_URL };
                appendToQueryString = true;
            }
        }

        const vpnFailurePage = this.vpnInfo && this.vpnInfo.vpnFailurePage;
        const appId = this.credentials.getAppId();

        const queryString = qs.stringify({ token, app_id: appId });

        const separator = appendToQueryString ? '&' : '?';

        return `${vpnFailurePage}${separator}${queryString}`;
    };
}

export default EndpointsService;
