import { translator } from '../translator';

export const UNLIMITED_FEATURES = [
    {
        image: 'unlimited.svg',
        title: translator.getMessage('popup_upgrade_screen_unlimited_speed'),
        info: translator.getMessage('popup_upgrade_screen_unlimited_speed_desc'),
    },
    {
        image: 'all-locations.svg',
        title: translator.getMessage('popup_upgrade_screen_all_locations'),
        info: translator.getMessage('popup_upgrade_screen_all_locations_desc'),
    },
    {
        image: 'unlimited-data.svg',
        title: translator.getMessage('popup_upgrade_screen_unlimited_data'),
        info: translator.getMessage('popup_upgrade_screen_unlimited_data_desc'),
    },
    {
        image: 'connect-devices.svg',
        title: translator.getMessage('popup_upgrade_screen_connect_devices'),
        info: translator.getMessage('popup_upgrade_screen_connect_devices_desc'),
    },
];
