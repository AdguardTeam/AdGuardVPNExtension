import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import {
    DnsOperationResult,
    MessageType,
    SETTINGS_IDS,
} from '../lib/constants';

type SubscriptionParams = {
    name: string | null;
    address: string | null;
};

const DNS_LINK_PROTOCOL = 'adguardvpnext:';

(() => {
    if (!(document instanceof Document)) {
        return;
    }

    const getSubscriptionParams = (urlParams: string[]): SubscriptionParams => {
        let name = null;
        let address = null;

        for (let i = 0; i < urlParams.length; i += 1) {
            const parts = urlParams[i].split('=', 2);
            if (parts.length !== 2) {
                // eslint-disable-next-line no-continue
                continue;
            }
            switch (parts[0]) {
                case 'name':
                    name = decodeURIComponent(parts[1]);
                    break;
                case 'address':
                    address = decodeURIComponent(parts[1]);
                    break;
                default:
                    break;
            }
        }

        return {
            name,
            address,
        };
    };

    const onLinkClicked = async (event: MouseEvent): Promise<void> => {
        if (event.button === 2) {
            // ignore right-click
            return;
        }

        // @ts-ignore
        const { target }: HTMLAnchorElement | null = event;

        if (!target
            || target.tagName.toLowerCase() !== 'a'
            || target.protocol !== DNS_LINK_PROTOCOL) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        let urlParams;
        if (target.search) {
            urlParams = target.search.substring(1).replace(/&amp;/g, '&').split('&');
        } else {
            const { href } = target;
            const index = href.indexOf('?');
            urlParams = href.substring(index + 1).replace(/&amp;/g, '&').split('&');
        }

        const subParams = getSubscriptionParams(urlParams);
        const address = subParams.address?.trim();

        const title = (subParams.name || address)?.trim();

        if (!address) {
            return;
        }

        const id = nanoid();

        const dnsServerData = {
            id,
            address,
            title,
        };

        const result = await browser.runtime.sendMessage({
            type: MessageType.ADD_CUSTOM_DNS_SERVER,
            data: { dnsServerData, notify: true },
        });

        if (result === DnsOperationResult.Success) {
            await browser.runtime.sendMessage({
                type: MessageType.SET_SETTING_VALUE,
                data: { settingId: SETTINGS_IDS.SELECTED_DNS_SERVER, value: id },
            });
        }
    };

    document.addEventListener('click', onLinkClicked);
})();
