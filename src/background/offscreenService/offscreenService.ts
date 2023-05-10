import browser from 'webextension-polyfill';

interface OffscreenServiceInterface {
    createOffscreenDocument(): Promise<void>;
}

class OffscreenService implements OffscreenServiceInterface {
    private offscreenDocumentPath = 'offscreen.html';

    private async hasOffscreenDocument(path: string): Promise<boolean> {
        // Check all windows controlled by the service worker to see if one
        // of them is the offscreen document with the given path
        const offscreenUrl = browser.runtime.getURL(path);
        // @ts-ignore
        const matchedClients = await clients.matchAll();
        // eslint-disable-next-line no-restricted-syntax
        for (const client of matchedClients) {
            if (client.url === offscreenUrl) {
                return true;
            }
        }
        return false;
    }

    public async createOffscreenDocument(): Promise<void> {
        if (!(await this.hasOffscreenDocument(this.offscreenDocumentPath))) {
            // @ts-ignore
            await browser.offscreen.createDocument({
                url: browser.runtime.getURL(this.offscreenDocumentPath),
                reasons: ['DISPLAY_MEDIA'],
                justification: 'send messages to service worker',
            });
        }
    }
}

export const offscreenService = new OffscreenService();
