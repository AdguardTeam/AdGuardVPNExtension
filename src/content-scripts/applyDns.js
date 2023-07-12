import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import { MessageType, SETTINGS_IDS } from '../lib/constants';

(() => {
    if (!(document instanceof HTMLDocument)) {
        return;
    }

    const getSubscriptionParams = (urlParams) => {
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

    const onLinkClicked = async (e) => {
        if (e.button === 2) {
            // ignore right-click
            return;
        }

        const { target } = e;

        if (!target
            || target.tagName.toLowerCase() !== 'a'
            || target.protocol !== 'adguardvpnext:') {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        let urlParams;
        if (target.search) {
            urlParams = target.search.substring(1).replace(/&amp;/g, '&').split('&');
        } else {
            const { href } = target;
            const index = href.indexOf('?');
            urlParams = href.substring(index + 1).replace(/&amp;/g, '&').split('&');
        }

        const subParams = getSubscriptionParams(urlParams);
        const address = subParams.address.trim();

        // FIXME: validate dns address

        const title = (subParams.name || address).trim();

        if (!address) {
            return;
        }

        const id = nanoid();

        const dnsServerData = {
            id,
            address,
            title,
        };

        await browser.runtime.sendMessage({
            type: MessageType.ADD_CUSTOM_DNS_SERVER,
            data: { dnsServerData, notify: true },
        });

        await browser.runtime.sendMessage({
            type: MessageType.SET_SETTING_VALUE,
            data: { settingId: SETTINGS_IDS.SELECTED_DNS_SERVER, value: id },
        });
    };

    document.addEventListener('click', onLinkClicked);
})();
