import ipaddr from 'ipaddr.js';

/**
 * Checks if host is in net.
 *
 * @param host host address of application presented with ip
 * @param pattern
 * @param mask
 *
 * @returns True if host is in net, false otherwise.
 */
export const isInNet = (host: string, pattern: string, mask: string): boolean => {
    const addr = ipaddr.IPv4.parse(host);

    return addr.match([
        ipaddr.IPv4.parse(pattern),
        <number>ipaddr.IPv4.parse(mask).prefixLengthFromSubnetMask(),
    ]);
};

export const convertCidrToNet = (cidr: string): [string, string] => {
    const [ipAddress, subnetPrefix] = ipaddr.parseCIDR(cidr);
    return [
        ipAddress.toString(),
        ipaddr.IPv4.subnetMaskFromPrefixLength(subnetPrefix).toString(),
    ];
};
