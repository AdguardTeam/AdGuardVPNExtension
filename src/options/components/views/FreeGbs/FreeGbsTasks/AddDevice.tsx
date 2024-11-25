import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { COMPLETE_TASK_BONUS_GB } from '../../../../stores/consts';
import { getForwarderUrl } from '../../../../../common/helpers';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { FORWARDER_URL_QUERIES } from '../../../../../background/config';
import { Icon } from '../../../ui/Icon';

import { type BaseProps, FreeGbsTask } from './FreeGbsTask';

export const AddDevice = observer(({ onBackClick }: BaseProps) => {
    const { settingsStore } = useContext(rootStore);

    const { multiplatformBonus, forwarderDomain } = settingsStore;
    const otherProductsUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.OTHER_PRODUCTS);
    const isCompleted = !multiplatformBonus.available;

    const title = isCompleted
        ? reactTranslator.getMessage('settings_free_gbs_devices_added_title')
        : reactTranslator.getMessage('settings_free_gbs_add_device_title');
    const description = isCompleted
        ? reactTranslator.getMessage('settings_free_gbs_devices_added_info')
        : reactTranslator.getMessage('settings_free_gbs_add_device_info', { your_gb: COMPLETE_TASK_BONUS_GB });

    return (
        <FreeGbsTask
            imageName="add-device"
            title={title}
            description={description}
            contentClassName="add-device"
            completed={isCompleted}
            onBackClick={onBackClick}
        >
            <img
                src="../../../../assets/images/products.svg"
                className="add-device__products"
                alt="products"
            />
            <a
                href={otherProductsUrl}
                target="_blank"
                rel="noreferrer"
                className="button button--default button--medium add-device__link"
            >
                <Icon name="external-link" className="add-device__link-icon" />
                {reactTranslator.getMessage('settings_free_gbs_add_device_products_button')}
            </a>
        </FreeGbsTask>
    );
});
