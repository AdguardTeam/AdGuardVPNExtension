import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../reactCommon/reactTranslator';
import rootStore from '../../stores';
import './promo-sale.pcss';

const PromoSale = observer(() => {
    const { vpnStore, settingsStore } = useContext(rootStore);

    const upgradeClickHandler = async (e) => {
        e.preventDefault();
        await settingsStore.setSalePromoStatus(false);
        await settingsStore.setShowPromo(false);
        await vpnStore.openPremiumPromoPage();
    };

    const hideSaleClickHandler = async () => {
        await settingsStore.setSalePromoStatus(false);
        await settingsStore.setShowPromo(false);
    };

    const features = [
        { id: 1, text: 'upgrade_features_data' },
        { id: 2, text: 'upgrade_features_speed' },
        { id: 3, text: 'upgrade_features_encrypt' },
        { id: 4, text: 'upgrade_features_no_log' },
    ];

    return (
        <>
            <div className="sale">
                <div className="sale__content">
                    <div className="sale__icon" />
                    <div className="sale__price-label">
                        {reactTranslator.translate('settings_run_upgrade_early_bird')}
                    </div>
                    <div className="sale__title">
                        {reactTranslator.translate('sale_title')}
                    </div>
                    <div className="sale__features-list">
                        {features.map((item) => {
                            return (
                                <div className="sale__features-item" key={item.id}>
                                    {reactTranslator.translate(item.text)}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="sale__actions">
                    <a
                        className="button button--medium button--green sale__button"
                        onClick={upgradeClickHandler}
                    >
                        {reactTranslator.translate('premium_upgrade')}
                    </a>
                    <a
                        className="sale__continue-button"
                        onClick={hideSaleClickHandler}
                    >
                        {reactTranslator.translate('continue_us_free_button')}
                    </a>
                </div>
            </div>
        </>
    );
});

export default PromoSale;
