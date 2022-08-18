import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { reactTranslator } from '../../../common/reactTranslator';
import { COMPLETE_TASK_BONUS_GB } from '../../stores/consts';

export const AddDevice = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore } = useContext(rootStore);

    return (
        <div>
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
            <Title title={reactTranslator.getMessage('settings_free_gbs_add_device_title')} />
            <div className="free-gbs__info">
                {reactTranslator.getMessage('settings_free_gbs_add_device_info', { your_gb: COMPLETE_TASK_BONUS_GB })}
            </div>
            <img
                src="../../../assets/images/products.svg"
                className="free-gbs__products-pic"
                alt="products"
            />
            <button
                type="button"
                className="button button--large button--primary"
            >
                <svg className="icon icon--button free-gbs__external-link">
                    <use xlinkHref="#external-link" />
                </svg>
                {reactTranslator.getMessage('settings_free_gbs_add_device_products_button')}
            </button>
        </div>
    );
});
