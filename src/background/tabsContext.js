import tabs from './tabs';
import ip from './ip';
import webRequest from './webRequest';

const tabsMap = {};

const handleTabsAdd = (tab) => {
    const { id, url } = tab;
    tabsMap[id] = { id, url };
};

const handleTabsRemove = (tabId) => {
    delete tabsMap[tabId];
};

const updateTabData = (tabId, data) => {
    if (!data) {
        return;
    }

    const { url, ip } = data;
    const newData = { id: tabId };
    if (url) {
        newData.url = url;
    }
    if (ip) {
        newData.ip = ip;
    }

    const currentTabData = tabsMap[tabId];
    if (!currentTabData) {
        tabsMap[tabId] = newData;
    } else {
        tabsMap[tabId] = { ...currentTabData, ...newData };
    }
};

const handleTabsUpdate = (tab, changeInfo) => {
    const { url } = changeInfo;
    if (!url) {
        return;
    }
    const { id } = tab;
    updateTabData(id, { url });
};

const extractIp = (details) => {
    const {
        ip, initiator, url, type,
    } = details;
    if (!ip) {
        return null;
    }
    if (type && type === 'main_frame') {
        return ip;
    }
    if (initiator && initiator.indexOf(url) !== -1) {
        return ip;
    }
    return null;
};

const handleRequestEventsWithIp = (details) => {
    const { tabId } = details;
    const ip = extractIp(details);
    if (!ip) {
        return;
    }
    updateTabData(tabId, { ip });
};

const listenUpdates = () => {
    tabs.onCreated(handleTabsAdd);
    tabs.onRemoved(handleTabsRemove);
    tabs.onUpdated(handleTabsUpdate);
    webRequest.onCompleted(handleRequestEventsWithIp);
    webRequest.onResponseStarted(handleRequestEventsWithIp);
};

const getTabIp = (tabId) => {
    if (!tabId) {
        return undefined;
    }
    const tabData = tabsMap[tabId];
    return tabData && tabData.ip;
};

const isTabRoutable = async (currentTabId) => {
    const tabIp = getTabIp(currentTabId);
    if (!tabIp) {
        return true;
    }
    return ip.isIpRoutable(tabIp);
};

const initTabsContext = async () => {
    const allTabs = await tabs.getAllTabs();
    allTabs.forEach(({ url, id }) => {
        tabsMap[id] = { id, url };
    });
    listenUpdates();
};

// Init tabs context
(async () => {
    await initTabsContext();
})();

export default { isTabRoutable };
