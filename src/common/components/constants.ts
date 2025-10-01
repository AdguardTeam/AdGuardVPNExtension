import { translator } from '../translator';
import unlimitedImageUrl from '../../assets/images/unlimited.svg';
import allLocationsImageUrl from '../../assets/images/all-locations.svg';
import unlimitedDataImageUrl from '../../assets/images/unlimited-data.svg';
import connectDevicesImageUrl from '../../assets/images/connect-devices.svg';

/**
 * Number of devices available in the unlimited plan.
 */
export const POTENTIAL_DEVICE_NUM = 10;

export const UNLIMITED_FEATURES = [
    {
        imageUrl: unlimitedImageUrl,
        title: translator.getMessage('popup_upgrade_screen_unlimited_speed'),
        info: translator.getMessage('popup_upgrade_screen_unlimited_speed_desc'),
    },
    {
        imageUrl: allLocationsImageUrl,
        title: translator.getMessage('popup_upgrade_screen_all_locations'),
        info: translator.getMessage('popup_upgrade_screen_all_locations_desc'),
    },
    {
        imageUrl: unlimitedDataImageUrl,
        title: translator.getMessage('popup_upgrade_screen_unlimited_data'),
        info: translator.getMessage('popup_upgrade_screen_unlimited_data_desc'),
    },
    {
        imageUrl: connectDevicesImageUrl,
        title: translator.getMessage('popup_upgrade_screen_connect_devices', {
            potential_num: POTENTIAL_DEVICE_NUM,
        }),
        info: translator.getMessage('popup_upgrade_screen_connect_devices_desc'),
    },
];
