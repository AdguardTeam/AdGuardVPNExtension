import React, { useContext } from 'react';
import { rootStore } from '../../../stores';
import './upgrade-screen.pcss';
import { reactTranslator } from '../../../../common/reactTranslator';
import { CloseButton } from '../../ui/CloseButton';

export const UpgradeScreen = () => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const handleUpgradeClick = async () => {
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
                key="upgrade"
                type="button"
                onClick={handleUpgradeClick}
                className="button button--medium button--green upgrade-screen__button"
            >
                {reactTranslator.getMessage('popup_upgrade_screen_upgrade_button')}
            </button>
            <button
                key="free-use"
                type="button"
                onClick={handleSkipClick}
                className="upgrade-screen__continue-button"
            >
                {reactTranslator.getMessage('popup_upgrade_screen_continue_free')}
            </button>
        </div>
    );
};
