import React, { type ReactElement, useContext } from 'react';

import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';
import { POTENTIAL_DEVICE_NUM } from '../../../../common/components/constants';
import upgradeImgUrl from '../../../../assets/images/upgrade-subscription.svg';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';

import './upgrade-screen.pcss';

export const UpgradeScreen = (): ReactElement => {
    const { authStore, vpnStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.PurchaseScreen,
    );

    const handleUpgradeClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OnboardingPurchaseClick,
            TelemetryScreenName.PurchaseScreen,
        );
        await authStore.setShowUpgradeScreen(false);
        await vpnStore.openPremiumPromoPage();
        window.close();
    };

    const handleSkipClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OnboardingStayFreeClick,
            TelemetryScreenName.PurchaseScreen,
        );
        await authStore.setShowUpgradeScreen(false);
    };

    return (
        <div className="upgrade-screen">
            <div className="upgrade-screen__image-wrapper">
                <img
                    src={upgradeImgUrl}
                    className="upgrade-screen__image"
                    alt="upgrade-screen"
                />
            </div>
            <div className="upgrade-screen__content">
                <div className="upgrade-screen__title">
                    {translator.getMessage('popup_upgrade_screen_title')}
                </div>
                <div className="upgrade-screen__info">
                    {translator.getMessage('popup_upgrade_screen_info_with_devices', {
                        // POTENTIAL_DEVICE_NUM is used because vpnStore.maxDevicesAllowed
                        // is available only in case of ConnectionLimitError
                        maxDevicesAllowed: POTENTIAL_DEVICE_NUM,
                    })}
                </div>
            </div>
            <div className="upgrade-screen__actions">
                <button
                    type="button"
                    onClick={handleUpgradeClick}
                    className="button button--large button--green"
                >
                    {translator.getMessage('popup_upgrade_screen_upgrade_button')}
                </button>
                <button
                    type="button"
                    onClick={handleSkipClick}
                    className="button button--medium upgrade-screen__continue-button"
                >
                    {translator.getMessage('popup_upgrade_screen_continue_free')}
                </button>
            </div>
        </div>
    );
};
