import { isIP } from 'is-ip';

import { type DnsServerData } from '../../../../background/schema';
import { translator } from '../../../../common/translator';

/**
 * Max length of dns server name.
 *
 * 64 characters seems to be a reasonable limit for a DNS server name,
 * because if it will be longer, it will be rendered in 3 rows in the UI.
 */
const MAX_DNS_SERVER_NAME_LENGTH = 64;

const DNS_SERVER_NAME_ERRORS = {
    TOO_LONG: (current: number, max: number) => (
        translator.getMessage('settings_dns_add_custom_server_too_long_name', {
            current,
            max,
        })
    ),
};

/**
 * Validate custom dns server name.
 *
 * @param name Name to validate.
 * @returns Error message if name is invalid, otherwise null.
 */
export const validateDnsServerName = (name: string): string | null => {
    // If exceeds max character limit
    if (name.length > MAX_DNS_SERVER_NAME_LENGTH) {
        return DNS_SERVER_NAME_ERRORS.TOO_LONG(name.length, MAX_DNS_SERVER_NAME_LENGTH);
    }

    return null;
};

/**
 * Normalize dns server name.
 * This function trims and removes extra spaces from the name.
 *
 * @param name Name to normalize.
 * @returns Normalized name.
 */
export const normalizeDnsServerName = (name: string) => {
    return name.trim().replace(/\s+/g, ' ');
};

const DOH_PREFIX = 'https://';
const DOT_PREFIX = 'tls://';

const DNS_SERVER_ADDRESS_ERRORS = {
    INVALID: translator.getMessage('settings_dns_add_custom_server_invalid_address'),
    DUPLICATE: translator.getMessage('settings_dns_add_custom_server_duplicate_address'),
};

/**
 * Validate custom dns server address.
 *
 * @param customDnsServers List of custom dns servers.
 * @param address Address to validate.
 * @returns Error message if address is invalid, otherwise null.
 */
export const validateDnsServerAddress = (
    customDnsServers: DnsServerData[],
    address: string,
): string | null => {
    // check existing custom dns addresses
    if (customDnsServers.some((server) => server.address === address)) {
        return DNS_SERVER_ADDRESS_ERRORS.DUPLICATE;
    }

    // for the moment only plain dns and tls supported
    if (address.startsWith(DOH_PREFIX) || !address.includes('.')) {
        return DNS_SERVER_ADDRESS_ERRORS.INVALID;
    }
    return null;
};

/**
 * Normalize dns server address.
 * This function adds tls:// prefix to the address if it's not an IP address.
 *
 * @param address Address to normalize.
 * @returns Normalized address.
 */
export const normalizeDnsServerAddress = (address: string) => {
    if (isIP(address) || address.startsWith(DOT_PREFIX)) {
        return address;
    }
    return `${DOT_PREFIX}${address}`;
};
