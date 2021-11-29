import React, { useContext } from 'react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { CloseButton } from '../../ui/CloseButton';

import './upgrade-screen.pcss';

export const UpgradeScreen = () => {
    const { authStore, vpnStore } = useContext(rootStore);

    const handleUpgradeClick = async () => {
        await authStore.setShowUpgradeScreen(false);
        await vpnStore.openPremiumPromoPage();
    };

    const handleSkipClick = async () => {
        await authStore.setShowUpgradeScreen(false);
    };

    const benefits = {
        data: 'popup_upgrade_screen_unlimited_data',
        speed: 'popup_upgrade_screen_unlimited_speed',
        locations: 'popup_upgrade_screen_all_locations',
        streaming: 'popup_upgrade_screen_streaming',
    };

    return (
        <div className="upgrade-screen">
            <CloseButton handler={handleSkipClick} />
            <img
                src="../../../../assets/images/upgrade.svg"
                className="upgrade-screen__image"
                alt="upgrade-screen"
            />
            <div className="upgrade-screen__title">
                {reactTranslator.getMessage('popup_upgrade_screen_title')}
            </div>
            <div className="upgrade-screen__info">
                {Object.keys(benefits).map((benefit) => {
                    return (
                        <div className="upgrade-screen__benefit" key={benefit}>
                            {reactTranslator.getMessage(benefits[benefit])}
                        </div>
                    );
                })}
            </div>
            <button
                type="button"
                onClick={handleUpgradeClick}
                className="button button--medium button--green upgrade-screen__subscribe-button"
            >
                {reactTranslator.getMessage('popup_upgrade_screen_upgrade_button')}
            </button>
            <button
                type="button"
                onClick={handleSkipClick}
                className="button button--medium upgrade-screen__continue-button"
            >
                {reactTranslator.getMessage('popup_upgrade_screen_continue_free')}
            </button>
        </div>
    );
};
