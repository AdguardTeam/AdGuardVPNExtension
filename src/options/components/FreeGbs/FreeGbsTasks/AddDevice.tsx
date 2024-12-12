import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { getForwarderUrl } from '../../../../common/helpers';
import { translator } from '../../../../common/translator';
import { FORWARDER_URL_QUERIES } from '../../../../background/config';
import { COMPLETE_TASK_BONUS_GB } from '../../../stores/consts';
import { rootStore } from '../../../stores';
import { Icon } from '../../ui/Icon';

import { type BaseProps, FreeGbsTask } from './FreeGbsTask';

export const AddDevice = observer(({ onBackClick }: BaseProps) => {
    const { settingsStore } = useContext(rootStore);
    const { multiplatformBonus, forwarderDomain } = settingsStore;

    const otherProductsUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.OTHER_PRODUCTS);
    const isCompleted = !multiplatformBonus.available;

    const title = isCompleted
        // FIXME: Update translation text
        // ? translator.getMessage('settings_free_gbs_devices_added_title')
        ? 'Another platform added'
        // FIXME: Update translation text
        // : translator.getMessage('settings_free_gbs_add_device_title');
        : 'Add another platform';

    const description = isCompleted
        // FIXME: Update translation text
        // ? translator.getMessage('settings_free_gbs_devices_added_info')
        ? 'Congrats with installing AdGuard VPN on multiple platforms. Stay safe!'
        // FIXME: Update translation text
        // : translator.getMessage('settings_free_gbs_add_device_info', { your_gb: COMPLETE_TASK_BONUS_GB });
        : `Install AdGuard VPN for iOS, Mac, Windows, or Android, log in to your AdGuard account there, and get ${COMPLETE_TASK_BONUS_GB} GB.`;

    return (
        <FreeGbsTask
            imageName="add-device.svg"
            title={title}
            description={description}
            contentClassName="add-device"
            completed={isCompleted}
            onBackClick={onBackClick}
        >
            <img
                src="../../../assets/images/products.svg"
                className="add-device__products"
                alt="products"
            />
            <a
                href={otherProductsUrl}
                target="_blank"
                rel="noreferrer"
                className="button button--filled add-device__link"
            >
                <Icon name="external-link" className="add-device__link-icon" />
                {translator.getMessage('settings_free_gbs_add_device_products_button')}
            </a>
        </FreeGbsTask>
    );
});
