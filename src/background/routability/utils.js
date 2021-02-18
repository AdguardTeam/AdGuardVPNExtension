import ipaddr from 'ipaddr.js';

/**
 * Checks if host is in net
 * @param host host address of application presented with ip
 * @param pattern
 * @param mask
 */
export const isInNet = (host, pattern, mask) => {
    const addr = ipaddr.parse(host);
    return addr.match([
        ipaddr.IPv4.parse(pattern),
        ipaddr.IPv4.parse(mask).prefixLengthFromSubnetMask(),
    ]);
};

export const convertCidrToNet = (cidr) => {
    const [ipAddress, subnetPrefix] = ipaddr.parseCIDR(cidr);
    return [
        ipAddress.toString(),
        ipaddr.IPv4.subnetMaskFromPrefixLength(subnetPrefix).toString(),
    ];
};
