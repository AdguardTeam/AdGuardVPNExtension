import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';
import isNil from 'lodash/isNil';

import { rootStore } from '../../stores';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';

import { GlobalControl } from './GlobalControl';
import { Status } from './Status';
import { BackgroundAnimation } from './BackgroundAnimation';

import './settings.pcss';

export const Settings = observer(() => {
    const {
        settingsStore,
        vpnStore,
        uiStore,
        telemetryStore,
        authStore,
    } = useContext(rootStore);

    const { isConnected, showServerErrorPopup } = settingsStore;

    const {
        isOpenOptionsModal,
        shouldShowLimitedOfferDetails,
        isShownVpnBlockedErrorDetails,
    } = uiStore;

    const {
        premiumPromoEnabled,
        isPremiumToken,
        tooManyDevicesConnected,
        maxDevicesAllowed,
    } = vpnStore;

    const { showRateModal, showConfirmRateModal } = authStore;

    const isDeviceLimitScreenRendered = tooManyDevicesConnected && !isNil(maxDevicesAllowed);

    const canSendTelemetry = !isOpenOptionsModal // `MenuScreen` is rendered on top of this screen
        && !shouldShowLimitedOfferDetails // `PromoOfferScreen` is rendered on top of this screen
        && !isDeviceLimitScreenRendered // `DeviceLimitScreen` is rendered on top of this screen
        && !isShownVpnBlockedErrorDetails // `DialogDesktopVersionPromo` is rendered on top of this screen
        && !showServerErrorPopup // `DialogCantConnect` is rendered on top of this screen
        && !showRateModal // `DialogRateUs` is rendered on top of this screen
        && !showConfirmRateModal; // `DialogRateInStore` / `DialogHelpUsImprove` is rendered on top of this screen

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.HomeScreen,
        canSendTelemetry,
    );

    const settingsClass = classnames(
        'settings',
        { 'settings--active': isConnected },
        { 'settings--premium-promo': premiumPromoEnabled },
        { 'settings--trial': !isPremiumToken },
        { 'settings--feedback': !premiumPromoEnabled },
    );

    return (
        <div className={settingsClass}>
            <BackgroundAnimation />
            <div className="settings__animation-overlay" />
            <div className="settings__main">
                <Status />
                <GlobalControl />
            </div>
        </div>
    );
});
