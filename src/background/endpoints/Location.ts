import type { EndpointInterface, LocationData, LocationInterface } from '../schema';

import { Endpoint } from './Endpoint';

export interface LocationWithPingInterface extends LocationData {
    ping: number;
}

export class Location implements LocationInterface {
    id: string;

    countryName: string;

    cityName: string;

    countryCode: string;

    endpoints: EndpointInterface[];

    coordinates: [
        longitude: number,
        latitude: number,
    ];

    premiumOnly: boolean;

    pingBonus: number;

    virtual: boolean;

    available: boolean;

    ping: number | null;

    endpoint: EndpointInterface | null;

    constructor(locationData: LocationData) {
        this.id = locationData.id;
        this.countryName = locationData.countryName;
        this.cityName = locationData.cityName;
        this.countryCode = locationData.countryCode;
        this.endpoints = locationData.endpoints.map((endpoint) => new Endpoint(endpoint));
        this.coordinates = locationData.coordinates;
        this.premiumOnly = locationData.premiumOnly;
        this.pingBonus = locationData.pingBonus;
        this.virtual = locationData.virtual;
        this.available = true;
        this.ping = null;
        this.endpoint = null;
    }
}
