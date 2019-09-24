import { proxy } from './proxy';
import { getHostname } from '../lib/helpers';

class Whitelist {
    constructor() {
        this.whitelisted = [];
    }

    async addToWhitelist(url) {
        this.whitelisted = [...this.whitelisted, getHostname(url)];
        await proxy.setBypassWhitelist(this.whitelisted);
    }

    async removeFromWhitelist(url) {
        this.whitelisted = this.whitelisted
            .filter(hostname => hostname !== getHostname(url));
        await proxy.setBypassWhitelist(this.whitelisted);
    }

    isWhitelisted = async (url) => {
        if (url) {
            return this.whitelisted.includes(getHostname(url));
        }
        return false;
    }
}

const whitelist = new Whitelist();

export default whitelist;
