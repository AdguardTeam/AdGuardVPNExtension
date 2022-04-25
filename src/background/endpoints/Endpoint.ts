export interface EndpointInterface {
    id: string;
    ipv4Address: string;
    ipv6Address: string;
    domainName: string;
    publicKey: string;
}
/**
 * Class representing endpoint structure
 */
export class Endpoint implements EndpointInterface {
    id: string;

    ipv4Address: string;

    ipv6Address: string;

    domainName: string;

    publicKey: string;

    constructor({
        id,
        ipv4Address,
        ipv6Address,
        domainName,
        publicKey,
    }: EndpointInterface) {
        this.id = id;
        this.ipv4Address = ipv4Address;
        this.ipv6Address = ipv6Address;
        this.domainName = domainName;
        this.publicKey = publicKey;
    }
}
