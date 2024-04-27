import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { getForwarderUrl } from '../../../common/helpers';
import { reactTranslator } from '../../../common/reactTranslator';
import { COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { FORWARDER_URL_QUERIES } from '../../../background/config';

export const AddDevice = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore } = useContext(rootStore);
    const { multiplatformBonus, forwarderDomain } = settingsStore;

    const otherProductsUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.OTHER_PRODUCTS);

    const getContent = () => {
        if (multiplatformBonus.available) {
            return (
                <>
                    <Title title={reactTranslator.getMessage('settings_free_gbs_add_device_title')} />
                    <div className="free-gbs__info">
                        {reactTranslator.getMessage('settings_free_gbs_add_device_info', { your_gb: COMPLETE_TASK_BONUS_GB })}
                    </div>
                    <img
                        src="../../../assets/images/products.svg"
                        className="free-gbs__products-pic"
                        alt="products"
                    />
                    <a
                        className="button button--large button--primary"
                        href={otherProductsUrl}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <svg className="icon icon--button free-gbs__external-link">
                            <use xlinkHref="#external-link" />
                        </svg>
                        {reactTranslator.getMessage('settings_free_gbs_add_device_products_button')}
                    </a>
                </>
            );
        }

        return (
            <>
                <Title title={reactTranslator.getMessage('settings_free_gbs_devices_added_title')} />
                <div className="free-gbs__info">{reactTranslator.getMessage('settings_free_gbs_devices_added_info')}</div>
                <button
                    type="button"
                    className="button button--large button--outline-secondary free-gbs__button"
                    onClick={goBackHandler}
                >
                    {reactTranslator.getMessage('settings_free_gbs_go_back')}
                </button>
            </>
        );
    };

    return (
        <div className="free-gbs__content">
            <button
                className="free-gbs__back-button"
                type="button"
                onClick={goBackHandler}
            >
                <svg className="icon icon--button">
                    <use xlinkHref="#arrow" />
                </svg>
            </button>
            <div className="free-gbs__picture free-gbs__add-device-pic" />
            {getContent()}
        </div>
    );
});
