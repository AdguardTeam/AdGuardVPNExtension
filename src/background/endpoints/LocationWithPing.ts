import { type LocationInterface } from '../schema';
import { type LocationWithPingInterface } from '../../common/schema/endpoints/locationWithPing';

/**
 * Helper class used to extract minimal set of information for UI
 */
export class LocationWithPing implements LocationWithPingInterface {
    public id: string;

    public cityName: string;

    public countryName: string;

    public countryCode: string;

    public ping?: number | null;

    public available?: boolean;

    public premiumOnly: boolean;

    public virtual: boolean;

    constructor(location: LocationInterface) {
        this.id = location.id;
        this.cityName = location.cityName;
        this.countryName = location.countryName;
        this.countryCode = location.countryCode;
        this.ping = location.ping;
        this.available = location.available;
        this.premiumOnly = location.premiumOnly;
        this.virtual = location.virtual;
    }
}
