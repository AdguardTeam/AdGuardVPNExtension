import browserApi from './browserApi';
import { updateService } from './updateService';
import { USER_SERVICE_KEYS, PROMO_SCREEN_STATES } from '../lib/constants';

const DEFAULTS = {
    [USER_SERVICE_KEYS.SHOW_ONBOARDING]: true,
    [USER_SERVICE_KEYS.SHOW_UPGRADE_SCREEN]: true,
    [USER_SERVICE_KEYS.SALE_SHOW]: PROMO_SCREEN_STATES.DISPLAY_AFTER_CONNECT_CLICK,
};

class UserService {
    set = async (field, value) => {
        await browserApi.storage.set(field, value);
    };

    get = async (field) => {
        return browserApi.storage.get(field);
    };

    setDefaults = async () => {
        const defaults = [];
        Object.keys(DEFAULTS).forEach((key) => {
            defaults.push(this.set(key, DEFAULTS[key]));
        });
        await Promise.all(defaults);
    };

    getUserServiceData = async () => {
        const userServiceDataKeys = Object.values(USER_SERVICE_KEYS);
        const userServiceDataValues = userServiceDataKeys.map((key) => this.get(key));
        const userServiceData = await Promise.all(userServiceDataValues);

        return Object.fromEntries(userServiceDataKeys
            .map((_, i) => [userServiceDataKeys[i], userServiceData[i]]));
    };

    register = async () => {
        await Promise.all([
            this.set(USER_SERVICE_KEYS.IS_NEW_USER, true),
            this.set(USER_SERVICE_KEYS.IS_SOCIAL_AUTH, false),
        ]);
    };

    authenticate = async () => {
        await Promise.all([
            this.set(USER_SERVICE_KEYS.IS_NEW_USER, false),
            this.set(USER_SERVICE_KEYS.IS_SOCIAL_AUTH, false),
        ]);
    };

    authenticateSocial = async () => {
        await Promise.all([
            this.set(USER_SERVICE_KEYS.IS_NEW_USER, false),
            this.set(USER_SERVICE_KEYS.IS_SOCIAL_AUTH, true),
        ]);
    };

    deauthenticate = async () => {
        await this.setDefaults();
        await updateService.setIsFirstRun(false);
    };

    init = async () => {
        await this.setDefaults();
    };
}

export const userService = new UserService();
