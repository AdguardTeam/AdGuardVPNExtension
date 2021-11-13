import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { PROMO_SCREEN_STATES } from '../../../lib/constants';
import { reactTranslator } from '../../../common/reactTranslator';

import './promo-sale.pcss';

const PromoSale = observer(() => {
    const {
        vpnStore,
        settingsStore,
        uiStore,
        authStore,
    } = useContext(rootStore);

    const upgradeClickHandler = async (e) => {
        e.preventDefault();
        settingsStore.setPremiumLocationClickedByFreeUser(false);
        uiStore.closeEndpointsSearch();
        await authStore.setSalePromoStatus(PROMO_SCREEN_STATES.DO_NOT_DISPLAY);
        await vpnStore.openPremiumPromoPage();
    };

    const hideSaleClickHandler = async () => {
        settingsStore.setPremiumLocationClickedByFreeUser(false);
        uiStore.closeEndpointsSearch();
        await authStore.setSalePromoStatus(PROMO_SCREEN_STATES.DO_NOT_DISPLAY);
    };

    const features = [
        { id: 1, text: 'upgrade_features_all_locations' },
        { id: 2, text: 'upgrade_features_data' },
        { id: 3, text: 'upgrade_features_speed' },
        { id: 4, text: 'upgrade_features_devices' },
        { id: 5, text: 'upgrade_features_streaming' },
    ];

    return (
        <>
            <div className="promo-sale">
                <div className="promo-sale__content">
                    <div className="promo-sale__icon" />
                    <div className="promo-sale__price-label">
                        {reactTranslator.getMessage('settings_run_upgrade_early_bird')}
                    </div>
                    <div className="promo-sale__title">
                        {reactTranslator.getMessage('sale_title')}
                    </div>
                    <div className="promo-sale__features-list">
                        {features.map((item) => {
                            return (
                                <div className="promo-sale__features-item" key={item.id}>
                                    {reactTranslator.getMessage(item.text)}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="promo-sale__actions">
                    <a
                        className="button button--medium button--green promo-sale__button"
                        onClick={upgradeClickHandler}
                    >
                        {reactTranslator.getMessage('premium_upgrade')}
                    </a>
                    <a
                        className="promo-sale__continue-button"
                        onClick={hideSaleClickHandler}
                    >
                        {reactTranslator.getMessage('continue_us_free_button')}
                    </a>
                </div>
            </div>
        </>
    );
});

export default PromoSale;
