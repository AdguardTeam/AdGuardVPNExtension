import throttle from 'lodash/throttle';
import ipaddr from 'ipaddr.js';
import log from '../../lib/logger';
import notifier from '../../lib/notifier';
import { getHostname } from '../../lib/helpers';
import { NON_ROUTABLE_NETS } from './nonRoutableNets';

class NonRoutableService {
    NON_ROUTABLE_KEY = 'non-routable.storage.key';

    NON_ROUTABLE_MAX_LENGTH = 1000;

    CLEAR_CAPACITY = 50;

    STORAGE_UPDATE_TIMEOUT_MS = 1000;

    LOCALHOST = 'localhost';

    nonRoutableList = [];

    constructor(storage) {
        this.storage = storage;
        this.parsedCIDRList = NON_ROUTABLE_NETS.map((net) => ipaddr.parseCIDR(net));
    }

    async init() {
        this.nonRoutableList = (await this.storage.get(this.NON_ROUTABLE_KEY)) || [];
        notifier.addSpecifiedListener(notifier.types.ADD_NON_ROUTABLE_DOMAIN, (payload) => {
            this.addDomainHandler(payload);
        });
        log.info('NonRoutable module was initiated successfully');
    }

    addDomainHandler(payload) {
        const hostname = getHostname(payload);
        this.addHostname(hostname);
    }

    updateStorage = throttle(async () => {
        while (this.nonRoutableList.length > this.NON_ROUTABLE_MAX_LENGTH) {
            this.nonRoutableList = this.nonRoutableList.slice(this.CLEAR_CAPACITY);
        }

        await this.storage.set(this.NON_ROUTABLE_KEY, this.nonRoutableList);
    }, this.STORAGE_UPDATE_TIMEOUT_MS);

    addHostname(hostname) {
        if (this.nonRoutableList.includes(hostname)) {
            return;
        }
        this.nonRoutableList.push(hostname);
        this.updateStorage();
    }

    isUrlRoutable(url) {
        const hostname = getHostname(url);
        if (!hostname) {
            return true;
        }

        if (hostname === this.LOCALHOST
            || this.nonRoutableList.includes(hostname)) {
            return false;
        }

        if (!ipaddr.isValid(hostname)) {
            return true;
        }

        const addr = ipaddr.parse(hostname);

        if (addr.kind() === 'ipv6') {
            return true;
        }

        return !this.parsedCIDRList.some((parsedCIDR) => addr.match(parsedCIDR));
    }

    getNonRoutableList() {
        return this.nonRoutableList;
    }
}

export default NonRoutableService;
