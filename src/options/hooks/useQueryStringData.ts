import { useEffect } from 'react';

import { CUSTOM_DNS_ANCHOR_NAME } from '../../common/constants';
import { log } from '../../common/logger';

/**
 * Interface describing the return value of useCustomDnsFromQuery hook.
 */
export interface CustomDnsData {
    // The 'name' query parameter value, or null if not present.
    name: string;
    // The 'address' query parameter value, or null if not present.
    address: string;
}

/**
 * Custom React hook to parse 'name' and 'address' query parameters from the current URL.
 * This hook is tied to a specific anchor (defined by CUSTOM_DNS_ANCHOR_NAME) and will
 * retrieve the parameters only if the anchor is present in the URL.
 *
 * @returns The parsed name and address values from the query string, and a function to clear
 * these specific parameters from the URL.
 */
export const useCustomDnsFromQuery = (dnsDataHandler: (data: CustomDnsData) => void): void => {
    // Clear specific query string parameters ('name' and 'address') from the URL
    const clearQueryString = (): void => {
        const searchParams = new URLSearchParams(window.location.search);

        searchParams.delete('name');
        searchParams.delete('address');

        let newSearchString = searchParams.toString();
        newSearchString = newSearchString ? `?${newSearchString}` : '';

        const newUrl = `${window.location.origin}${window.location.pathname}${newSearchString}`;
        window.history.pushState({}, '', newUrl); // Update the URL without reloading the page
    };

    useEffect(() => {
        // Check if the URL contains the specific anchor
        if (window.location.hash === `#${CUSTOM_DNS_ANCHOR_NAME}`) {
            const searchParams = new URLSearchParams(window.location.search);
            const name = searchParams.get('name');
            const address = searchParams.get('address');
            if (name && address) {
                dnsDataHandler({ name, address });
                clearQueryString();
            } else {
                log.error(`[vpn.useQueryStringData]: Failed to parse custom DNS link parameters from URL: ${window.location.href}`);
            }
        }
    }, []);
};
