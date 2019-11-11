import ipaddr from 'ipaddr.js';
import { getHostname } from '../lib/helpers';

export const NON_ROUTABLE_NETS = [
    '0.0.0.0/8',
    '10.0.0.0/8',
    '14.0.0.0/8',
    '24.0.0.0/8',
    '39.0.0.0/8',
    '127.0.0.0/8',
    '128.0.0.0/16',
    '169.254.0.0/16',
    '172.16.0.0/12',
    '191.255.0.0/16',
    '192.0.0.0/24',
    '192.0.2.0/24',
    '192.88.99.0/24',
    '192.168.0.0/16',
    '198.18.0.0/15',
    '223.255.255.0/24',
    '224.0.0.0/4',
    '240.0.0.0/4',
];

const parsedCIDRList = NON_ROUTABLE_NETS.map(net => ipaddr.parseCIDR(net));

const isUrlRoutable = (url) => {
    const hostname = getHostname(url);
    if (!hostname) {
        return true;
    }

    const LOCALHOST = 'localhost';

    if (hostname === LOCALHOST) {
        return false;
    }

    if (!ipaddr.isValid(hostname)) {
        return true;
    }

    const addr = ipaddr.parse(hostname);

    if (addr.kind() === 'ipv6') {
        return true;
    }

    return !parsedCIDRList.some(parsedCIDR => addr.match(parsedCIDR));
};

export default { isUrlRoutable };
