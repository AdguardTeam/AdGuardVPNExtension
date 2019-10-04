import { proxy } from './proxy';
import { getHostname } from '../lib/helpers';

export class Whitelist {
    constructor(proxy) {
        this.whitelisted = [];
        this.proxy = proxy;
    }

    async _setBypassWhitelist() {
        return this.proxy.setBypassWhitelist(this.whitelisted);
    }

    async addToWhitelist(url) {
        this.whitelisted = [...this.whitelisted, getHostname(url)];
        await this._setBypassWhitelist();
    }

    async removeFromWhitelist(url) {
        this.whitelisted = this.whitelisted
            .filter(hostname => hostname !== getHostname(url));
        await this._setBypassWhitelist();
    }

    isWhitelisted = async (url) => {
        if (url) {
            return this.whitelisted.includes(getHostname(url));
        }
        return false;
    };
}

const whitelist = new Whitelist(proxy);

export default whitelist;
