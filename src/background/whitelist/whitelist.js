import { getHostname } from '../../lib/helpers';

export default class Whitelist {
    constructor(proxy) {
        this.whitelisted = [];
        this.proxy = proxy;
    }

    _setBypassWhitelist = () => {
        return this.proxy.setBypassWhitelist(this.whitelisted);
    };

    async addToWhitelist(url) {
        this.whitelisted = [...this.whitelisted, getHostname(url)];
        await this._setBypassWhitelist();
    }

    async removeFromWhitelist(url) {
        this.whitelisted = this.whitelisted
            .filter(hostname => hostname !== getHostname(url));
        await this._setBypassWhitelist();
    }

    isWhitelisted = (url) => {
        if (url) {
            return this.whitelisted.includes(getHostname(url));
        }
        return false;
    };
}
