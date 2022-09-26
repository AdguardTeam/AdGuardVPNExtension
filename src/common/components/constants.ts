import { reactTranslator } from '../reactTranslator';

export const UNLIMITED_FEATURES = [
    {
        image: 'unlimited.svg',
        title: reactTranslator.getMessage('popup_upgrade_screen_unlimited_speed'),
        info: reactTranslator.getMessage('popup_upgrade_screen_unlimited_speed_desc'),
    },
    {
        image: 'all-locations.svg',
        title: reactTranslator.getMessage('popup_upgrade_screen_all_locations'),
        info: reactTranslator.getMessage('popup_upgrade_screen_all_locations_desc'),
    },
    {
        image: 'unlimited-data.svg',
        title: reactTranslator.getMessage('popup_upgrade_screen_unlimited_data'),
        info: reactTranslator.getMessage('popup_upgrade_screen_unlimited_data_desc'),
    },
    {
        image: 'connect-devices.svg',
        title: reactTranslator.getMessage('popup_upgrade_screen_connect_devices'),
        info: reactTranslator.getMessage('popup_upgrade_screen_connect_devices_desc'),
    },
];

export interface DnsServerData {
    id: string;
    title: string;
    address: string;
    desc?: string;
}
