import React, { useContext } from 'react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { CloseButton } from '../../ui/CloseButton';

import './upgrade-screen.pcss';

export const UpgradeScreen = () => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const handleUpgradeClick = async () => {
        await settingsStore.setShowUpgradeScreen(false);
        await vpnStore.openPremiumPromoPage();
    };

    const handleSkipClick = async () => {
        await settingsStore.setShowUpgradeScreen(false);
    };

    const features = ['traffic', 'speed', 'all_locations', 'torrents', 'streaming'];

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
                {features.map((feature) => {
                    return (
                        <div className="upgrade-screen__feature" key={feature}>
                            {reactTranslator.getMessage(`popup_upgrade_screen_${feature}`)}
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
