import ipaddr from 'ipaddr.js';

/**
 * Checks if host is in net
 * @param host host address of application presented with ip
 * @param pattern
 * @param mask
 */
export const isInNet = (host: string, pattern: string, mask: string) => {
    const addr = ipaddr.parse(host);

    // TODO remove ts-ignore
    // @ts-ignore
    return addr.match([
        ipaddr.IPv4.parse(pattern),
        ipaddr.IPv4.parse(mask).prefixLengthFromSubnetMask(),
    ]);
};

export const convertCidrToNet = (cidr: string): [string, string] => {
    const [ipAddress, subnetPrefix] = ipaddr.parseCIDR(cidr);
    return [
        ipAddress.toString(),
        ipaddr.IPv4.subnetMaskFromPrefixLength(subnetPrefix).toString(),
    ];
};
