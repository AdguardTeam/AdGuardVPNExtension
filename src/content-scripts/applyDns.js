import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

(() => {
    if (!(document instanceof HTMLDocument)) {
        return;
    }

    const getSubscriptionParams = (urlParams) => {
        let title = null;
        let address = null;

        for (let i = 0; i < urlParams.length; i += 1) {
            const parts = urlParams[i].split('=', 2);
            if (parts.length !== 2) {
                // eslint-disable-next-line no-continue
                continue;
            }
            switch (parts[0]) {
                case 'title':
                    title = decodeURIComponent(parts[1]);
                    break;
                case 'address':
                    address = decodeURIComponent(parts[1]);
                    break;
                default:
                    break;
            }
        }

        return {
            title,
            address,
        };
    };

    const onLinkClicked = async (e) => {
        debugger
        if (e.button === 2) {
            // ignore right-click
            return;
        }

        let { target } = e;
        while (target) {
            if (target instanceof HTMLAnchorElement) {
                break;
            }
            target = target.parentNode;
        }

        if (!target) {
            return;
        }

        // FIXME: register handler for protocol
        if (target.protocol === 'adguardvpnext:') {
            if (target.host !== 'add_dns_server') {
                return;
            }
        }

        debugger

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
        const url = subParams.address.trim();
        // FIXME: validate dns address

        const title = (subParams.title || url).trim();

        if (!url) {
            return;
        }

        const id = nanoid();

        await browser.runtime.sendMessage({
            type: 'add.custom.dns.server',
            dnsServerData: {
                id,
                url,
                title,
            },
        });

        // FIXME: add notification
    };

    document.addEventListener('click', onLinkClicked);
})();
