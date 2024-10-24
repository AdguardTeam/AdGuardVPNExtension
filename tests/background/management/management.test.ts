import type browser from 'webextension-polyfill';

import Management from '../../../src/background/management/Management';

const generateBrowser = (extensions: { id: string, permissions: string[], enabled: boolean }[]) => {
    return {
        management: {
            getAll: async () => {
                return extensions;
            },
            setEnabled: async (id: string, enabled: boolean) => {
                extensions.forEach((extension) => {
                    if (extension.id === id) {
                        // eslint-disable-next-line no-param-reassign
                        extension.enabled = enabled;
                    }
                });
            },
        },
        runtime: {
            id: 'our_extension_id',
        },
    };
};

describe('management', () => {
    const ourExtension = {
        id: 'our_extension_id', permissions: ['proxy', 'privacy', 'webRequests'], enabled: true,
    };

    const extensionWithoutProxy = {
        id: 'extension_without_proxy', permissions: ['privacy', 'webRequests'], enabled: true,
    };

    const disabledExtension = {
        id: 'already_disabled_extension', permissions: ['proxy', 'privacy', 'webRequests'], enabled: false,
    };

    const extensionWithProxy = {
        id: 'extension with proxy', permissions: ['proxy', 'privacy', 'webRequests'], enabled: true,
    };

    it('finds proxy extensions except extension itself', async () => {
        const browser = generateBrowser([
            { ...ourExtension },
            { ...extensionWithoutProxy },
            { ...disabledExtension },
            { ...extensionWithProxy },
        ]);

        const management = new Management(browser as browser.Browser);
        const extensions = await management.getEnabledProxyExtensions();

        expect(extensions).toContainEqual(extensionWithProxy);
        expect(extensions).not.toContainEqual(ourExtension);
        expect(extensions).not.toContainEqual(extensionWithoutProxy);
        expect(extensions).not.toContainEqual(disabledExtension);
    });

    it('turns off proxy extensions except itself and extensions without proxy permission', async () => {
        const ourExtensionClone = { ...ourExtension };
        const extensionWithoutProxyClone = { ...extensionWithoutProxy };
        const disabledExtensionClone = { ...disabledExtension };
        const extensionWithProxyClone = { ...extensionWithProxy };

        const browser = generateBrowser([
            ourExtensionClone,
            extensionWithoutProxyClone,
            disabledExtensionClone,
            extensionWithProxyClone,
        ]);

        const management = new Management(browser as browser.Browser);
        await management.turnOffProxyExtensions();
        const extensions = await management.getEnabledProxyExtensions();
        expect(extensions.length).toBe(0);

        expect(ourExtensionClone.enabled).toBeTruthy();
        expect(extensionWithoutProxyClone.enabled).toBeTruthy();
        expect(disabledExtensionClone.enabled).toBeFalsy();
        expect(extensionWithProxyClone.enabled).toBeFalsy();
    });
});
