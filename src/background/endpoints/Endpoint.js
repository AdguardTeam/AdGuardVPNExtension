/**
 * Class representing endpoint structure
 */
export class Endpoint {
    constructor({
        id,
        ipv4Address,
        ipv6Address,
        domainName,
        publicKey,
    }) {
        this.id = id;
        this.ipv4Address = ipv4Address;
        this.ipv6Address = ipv6Address;
        this.domainName = domainName;
        this.publicKey = publicKey;
    }
}
