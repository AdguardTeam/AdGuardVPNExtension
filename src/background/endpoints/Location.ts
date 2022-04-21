import { Endpoint, EndpointInterface } from './Endpoint';

export interface LocationData {
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
}

export interface LocationInterface extends LocationData {
    available: boolean;
    ping: number | null;
    endpoint: EndpointInterface | null;
}

export class Location {
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
        this.available = true;
        this.ping = null;
        this.endpoint = null;
    }
}
