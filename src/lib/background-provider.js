import browser from 'webextension-polyfill';

const asyncProvideBg = func => async (...args) => {
    const { background } = await browser.runtime.getBackgroundPage();
    return func(...args, background);
};

const wrapMethods = (obj, wrapper) => {
    Object.keys(obj).forEach((key) => {
        const property = obj[key];
        if (typeof property === 'function') {
            // eslint-disable-next-line no-param-reassign
            obj[key] = wrapper(property);
        }
    });
    return obj;
};

const vpn = {
    getVpnInfo: background => background.vpn.getVpnInfo(),
    getEndpoints: background => background.vpn.getEndpoints(),
    getCurrentLocation: background => background.vpn.getCurrentLocation(),
};

const settings = {
    getSetting: (id, background) => background.settings.getSetting(id),
    setSetting: (id, value, background) => background.settings.setSetting(id, value),
};

const proxy = {
    canControlProxy: background => background.proxy.canControlProxy(),
    setCurrentEndpoint: (endpoint, background) => background.proxy.setCurrentEndpoint(endpoint),
    getCurrentEndpoint: background => background.proxy.getCurrentEndpoint(),
};

const whitelist = {
    addToWhitelist: (url, background) => background.whitelist.addToWhitelist(url),
    removeFromWhitelist: (url, background) => background.whitelist.removeFromWhitelist(url),
    isWhitelisted: (url, background) => background.whitelist.isWhitelisted(url),
};

const tabs = {
    closePopup: background => background.tabs.closePopup(),
    openRecovery: background => background.tabs.openRecovery(),
    openTab: (url, background) => background.tabs.openTab(url),
};

const auth = {
    authenticate: (credentials, background) => background.auth.authenticate(credentials),
    authenticateSocial: (querystring, background) => background.auth.authenticateSocial(),
    isAuthenticated: background => background.auth.isAuthenticated(),
    deauthenticate: background => background.auth.deauthenticate(),
    // eslint-disable-next-line max-len
    startSocialAuth: (socialProvider, background) => background.auth.startSocialAuth(socialProvider),
    register: (socialProvider, background) => background.auth.register(socialProvider),
};

const actions = {
    openOptionsPage: background => background.actions.openOptionsPage(),
};

const connectivity = {
    getPing: background => background.connectivity.getPing(),
    getStats: background => background.connectivity.getStats(),
};

const appManager = {
    getAppStatus: background => background.appManager.getAppStatus(),
};

const tabsContext = {
    isTabRoutable: (tabId, background) => background.tabsContext.isTabRoutable(tabId),
    getActiveTabUrl: background => background.tabsContext.getActiveTabUrl(),
};

const authCache = {
    // eslint-disable-next-line max-len
    updateAuthCache: (field, value, background) => background.authCache.updateAuthCache(field, value),
    getAuthCache: background => background.authCache.getAuthCache(),
    clearAuthCache: background => background.authCache.clearAuthCache(),
};

const bgProvider = {
    vpn: wrapMethods(vpn, asyncProvideBg),
    settings: wrapMethods(settings, asyncProvideBg),
    proxy: wrapMethods(proxy, asyncProvideBg),
    whitelist: wrapMethods(whitelist, asyncProvideBg),
    tabs: wrapMethods(tabs, asyncProvideBg),
    actions: wrapMethods(actions, asyncProvideBg),
    auth: wrapMethods(auth, asyncProvideBg),
    connectivity: wrapMethods(connectivity, asyncProvideBg),
    appManager: wrapMethods(appManager, asyncProvideBg),
    tabsContext: wrapMethods(tabsContext, asyncProvideBg),
    authCache: wrapMethods(authCache, asyncProvideBg),
};

export default bgProvider;
