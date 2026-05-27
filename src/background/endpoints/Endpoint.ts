import type { EndpointInterface } from '../schema';

/**
 * Class representing endpoint structure
 */
export class Endpoint implements EndpointInterface {
    public id: string;

    public ipv4Address: string;

    public ipv6Address: string | null;

    public domainName: string;

    public publicKey: string;

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
