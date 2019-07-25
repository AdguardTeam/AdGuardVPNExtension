const SETTINGS = {
    globalProxyEnabled: {
        id: 'globalProxyEnabled',
        value: true,
    },
    // TODO move this setting into whitelist
    currentUrlProxyEnabled: {
        id: 'currentUrlProxyEnabled',
        value: true,
    },
    onlineTrackingPrevention: {
        id: 'onlineTrackingPrevention',
        value: true,
    },
    malwareProtection: {
        id: 'malwareProtection',
        value: true,
    },
};

const getSetting = settingId => SETTINGS[settingId];

const setSetting = (settingId, value) => {
    const setting = SETTINGS[settingId];
    if (setting.value !== value) {
        SETTINGS[settingId].value = value;
        console.log(`Setting ${settingId} value was set to: ${value}`);
        return true;
    }
    return false;
};

/**
 * Returns setting ids
 * @param settingsIds and array with settings ids
 * @returns {*}
 */
const getSettingsByIds = settingsIds => settingsIds.map(getSetting);

const settings = {
    getSetting,
    setSetting,
    getSettingsByIds,
};

export default settings;
