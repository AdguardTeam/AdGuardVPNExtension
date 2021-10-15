import browserApi from './browserApi';

import { USER_STATE_KEYS } from '../lib/constants';

const DEFAULTS = {
    [USER_STATE_KEYS.SHOW_ONBOARDING]: true,
    [USER_STATE_KEYS.SHOW_UPGRADE_SCREEN]: true,
};

const set = async (field, value) => {
    await browserApi.storage.set(field, value);
};

const get = async (field) => {
    return browserApi.storage.get(field);
};

const setDefaults = async () => {
    const defaults = [];
    Object.keys(DEFAULTS).forEach((key) => {
        defaults.push(set(key, DEFAULTS[key]));
    });
    await Promise.all(defaults);
};

const getUserState = async () => {
    const userStateKeys = Object.values(USER_STATE_KEYS);
    const userStateValues = userStateKeys.map((key) => get(key));

    return Promise.all(userStateValues)
        .then((values) => Object.fromEntries(userStateKeys
            .map((_, i) => [userStateKeys[i], values[i]])));
};

const register = async () => {
    await Promise.all([
        set(USER_STATE_KEYS.IS_NEW_USER, true),
        set(USER_STATE_KEYS.IS_SOCIAL_AUTH, false),
    ]);
};

const authenticate = async () => {
    await Promise.all([
        set(USER_STATE_KEYS.IS_NEW_USER, false),
        set(USER_STATE_KEYS.IS_SOCIAL_AUTH, false),
    ]);
};

const authenticateSocial = async () => {
    await Promise.all([
        set(USER_STATE_KEYS.IS_NEW_USER, false),
        set(USER_STATE_KEYS.IS_SOCIAL_AUTH, true),
    ]);
};

const deauthenticate = async () => {
    await setDefaults();
};

const init = async () => {
    await setDefaults();
};

export const userState = {
    set,
    getUserState,
    register,
    authenticate,
    authenticateSocial,
    deauthenticate,
    init,
};
