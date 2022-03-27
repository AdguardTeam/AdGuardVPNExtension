import axios from 'axios';
// @ts-ignore
import adapter from 'axios/lib/adapters/http';

import { vpnApi } from '../../../src/background/api';

// FIXME use test VPN_TOKEN, APP_ID and BASE_URL (??)
const VPN_TOKEN = '6fba3033-6d2f-466b-b4e2-83c4a6e0544b';
const APP_ID = 'nvZ5-ccQmuc_6CyQ9vUIz';
const BASE_URL = 'api.adguard.io/api';

if (typeof process !== undefined) {
    axios.defaults.adapter = adapter;
}

jest.spyOn(vpnApi, 'getBaseUrl');
// @ts-ignore
vpnApi.getBaseUrl.mockImplementation(() => BASE_URL);

describe('vpnApi', () => {
    afterAll(() => {
        jest.clearAllMocks();
    });

    it('getVpnCredentials test', async () => {
        const response = await vpnApi.getVpnCredentials(APP_ID, VPN_TOKEN);
        expect(response).toBeDefined();
        expect(response).toHaveProperty('license_status');
        expect(response).toHaveProperty('time_expires_sec');
        expect(response).toHaveProperty('result');
        expect(response.result).toHaveProperty('credentials');
        expect(response.result).toHaveProperty('expires_in_sec');
    });

    it('getVpnExtensionInfo test', async () => {
        const response = await vpnApi.getVpnExtensionInfo(VPN_TOKEN);
        expect(response).toBeDefined();
        expect(response).toHaveProperty('bandwidth_free_mbits');
        expect(response).toHaveProperty('premium_promo_page');
        expect(response).toHaveProperty('premium_promo_enabled');
        expect(response).toHaveProperty('refresh_tokens');
        expect(response).toHaveProperty('vpn_failure_page');
        expect(response).toHaveProperty('used_downloaded_bytes');
        expect(response).toHaveProperty('used_uploaded_bytes');
        expect(response).toHaveProperty('max_downloaded_bytes');
        expect(response).toHaveProperty('max_uploaded_bytes');
        expect(response).toHaveProperty('renewal_traffic_date');
        expect(response).toHaveProperty('connected_devices_count');
        expect(response).toHaveProperty('max_devices_count');
        expect(response).toHaveProperty('vpn_connected');
    });

    it('getLocations test', async () => {
        const response = await vpnApi.getLocations(VPN_TOKEN);
        expect(response).toBeDefined();
        expect(response.locations).toBeDefined();
        expect(response.locations[0]).toBeDefined();
        expect(response.locations[0]).toHaveProperty('id');
        expect(response.locations[0]).toHaveProperty('country_name');
        expect(response.locations[0]).toHaveProperty('country_code');
        expect(response.locations[0]).toHaveProperty('city_name');
        expect(response.locations[0]).toHaveProperty('premium_only');
        expect(response.locations[0]).toHaveProperty('latitude');
        expect(response.locations[0]).toHaveProperty('longitude');
        expect(response.locations[0]).toHaveProperty('ping_bonus');
        expect(response.locations[0].endpoints[0]).toHaveProperty('domain_name');
        expect(response.locations[0].endpoints[0]).toHaveProperty('ipsec_domain_name');
        expect(response.locations[0].endpoints[0]).toHaveProperty('ipsec_remote_identifier');
        expect(response.locations[0].endpoints[0]).toHaveProperty('ipv4_address');
        expect(response.locations[0].endpoints[0]).toHaveProperty('ipv6_address');
        expect(response.locations[0].endpoints[0]).toHaveProperty('public_key');
    });

    it('getCurrentLocation test', async () => {
        const response = await vpnApi.getCurrentLocation();
        expect(response).toBeDefined();
        expect(response).toHaveProperty('ip');
        expect(response).toHaveProperty('country_code');
        expect(response).toHaveProperty('country');
        expect(response.country).toHaveProperty('names');
        expect(response.country.names[0]).toHaveProperty('locale');
        expect(response.country.names[0]).toHaveProperty('name');
        expect(response).toHaveProperty('location');
        expect(response.location).toHaveProperty('latitude');
        expect(response.location).toHaveProperty('longitude');
        expect(response).toHaveProperty('city');
    });

    it('postExtensionInstalled test', async () => {
        const response = await vpnApi.postExtensionInstalled(APP_ID);
        expect(response).toBeDefined();
        expect(response).toHaveProperty('social_providers');
    });

    it('getDesktopVpnConnectionStatus test', async () => {
        const response = await vpnApi.getDesktopVpnConnectionStatus();
        expect(response).toBeDefined();
        expect(response).toHaveProperty('connected');
    });

    it('getExclusionsServices test', async () => {
        const response = await vpnApi.getExclusionsServices();
        expect(response).toBeDefined();
        expect(response).toHaveProperty('services');
        expect(response.services[0]).toHaveProperty('service_id');
        expect(response.services[0]).toHaveProperty('service_name');
        expect(response.services[0]).toHaveProperty('icon_url');
        expect(response.services[0]).toHaveProperty('categories');
        expect(response.services[0]).toHaveProperty('modified_time');
        expect(response.categories[0]).toHaveProperty('id');
        expect(response.categories[0]).toHaveProperty('name');
    });

    it('getExclusionServiceDomains test', async () => {
        const response = await vpnApi.getExclusionServiceDomains(['skype']);
        expect(response).toBeDefined();
        expect(response).toHaveProperty('services');
        expect(response.services[0]).toHaveProperty('service_id');
        expect(response.services[0]).toHaveProperty('domains');
    });
});
