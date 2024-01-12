import { MessageType } from '../lib/constants';
import { log } from '../lib/logger';

const CUSTOM_PROTOCOL = 'adguardvpnext:';
const LINK_TAG_NAME = 'a';

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-use-before-define
const browser = chrome || browser;

/**
 * Gets the subscription parameters 'name' and 'address' from the specified URL.
 *
 * @param url The URL containing the subscription parameters.
 * @returns An object containing the 'name' and 'address' parameters, or null if not found.
 */
export const getSubscriptionParams = (url: string): { name: string | null, address: string | null } => {
    let urlObject: URL;
    try {
        urlObject = new URL(url);
    } catch (e) {
        log.error(`Failed to parse URL: ${url}, due to error: ${e}`);
        return { name: null, address: null };
    }
    const params = new URLSearchParams(urlObject.search);

    const name = params.get('name');
    const address = params.get('address');

    return {
        name: name ? decodeURIComponent(name) : null,
        address: address ? decodeURIComponent(address) : null,
    };
};

/**
 * Handles a link click event, specifically for links with a custom protocol.
 * If the link meets the criteria, it sends a message to handle the custom DNS link.
 *
 * @param event The mouse event object associated with the link click.
 * @returns A Promise that resolves to void.
 */
const onLinkClicked = async (event: MouseEvent): Promise<void> => {
    if (event.button === 2) {
        // ignore right-click
        return;
    }

    const target = event.target as HTMLAnchorElement | null;

    if (!target
        || target.tagName.toLowerCase() !== LINK_TAG_NAME
        || target.protocol !== CUSTOM_PROTOCOL) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const subParams = getSubscriptionParams(target.href);

    const address = subParams.address?.trim();
    const name = (subParams.name || address)?.trim();

    if (!address) {
        return;
    }

    await browser.runtime.sendMessage({
        type: MessageType.HANDLE_CUSTOM_DNS_LINK,
        data: { address, name },
    });
};

const main = () => {
    document.addEventListener('click', onLinkClicked);
};

main();
