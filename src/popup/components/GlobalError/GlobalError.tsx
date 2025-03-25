import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { popupActions } from '../../actions/popupActions';
import { translator } from '../../../common/translator';
import { isLocationsNumberAcceptable } from '../../../common/is-locations-number-acceptable';
import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry';
import confusedImageUrl from '../../../assets/images/confused.svg';

import './global-error.pcss';

export const GlobalError = observer(() => {
    const {
        settingsStore,
        vpnStore,
        uiStore,
        telemetryStore,
    } = useContext(rootStore);

    const { isOpenOptionsModal, isShownVpnBlockedErrorDetails } = uiStore;
    const { showServerErrorPopup } = settingsStore;

    const ERROR_TYPES = {
        PERMISSION: 'permission',
        CONTROL: 'control',
    };

    const handleTryAgain = async (): Promise<void> => {
        await settingsStore.checkPermissions();
        // forcibly update locations on try again
        const locations = await vpnStore.forceUpdateLocations();
        await vpnStore.setLocations(locations);
        settingsStore.setIsVpnBlocked(isLocationsNumberAcceptable(locations));
    };

    const handleLearnMore = async (): Promise<void> => {
        await popupActions.openVpnFailurePage();
    };

    const handleDisableExtensions = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();
        telemetryStore.sendCustomEvent(
            TelemetryActionName.DisableAnotherExtensionClick,
            TelemetryScreenName.DisableAnotherVpnExtensionScreen,
        );
        await settingsStore.disableOtherProxyExtensions();
    };

    let errorType = ERROR_TYPES.PERMISSION;

    if (settingsStore.hasGlobalError) {
        errorType = ERROR_TYPES.PERMISSION;
    }

    if (!settingsStore.canControlProxy) {
        errorType = ERROR_TYPES.CONTROL;
    }

    const canSendTelemetry = errorType === ERROR_TYPES.CONTROL
        && !isOpenOptionsModal // `MenuScreen` is rendered on top of this screen
        && !isShownVpnBlockedErrorDetails // `DialogDesktopVersionPromo` is rendered on top of this screen
        && !showServerErrorPopup; // `DialogCantConnect` is rendered on top of this screen

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DisableAnotherVpnExtensionScreen,
        canSendTelemetry,
    );

    if (errorType === ERROR_TYPES.CONTROL) {
        return (
            <div className="new-global-error new-global-error--control">
                <div className="new-global-error__image-wrapper">
                    <img
                        src={confusedImageUrl}
                        className="new-global-error__image"
                        alt="Confused Ninja"
                    />
                </div>
                <div className="new-global-error__content">
                    <div className="new-global-error__title">
                        {translator.getMessage('control_error_title')}
                    </div>
                    <div className="new-global-error__description">
                        {translator.getMessage('control_error_description')}
                    </div>
                    <button
                        type="button"
                        onClick={handleDisableExtensions}
                        className="button button--large button--green"
                    >
                        {translator.getMessage('control_error_disable')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="global-error">
            <div className="global-error__pic" />
            <div className="global-error__content">
                <div className="global-error__icon" />
                <div className="global-error__title">
                    {translator.getMessage('global_error_title')}
                </div>
                <div className="global-error__description">
                    {translator.getMessage('global_error_description')}
                </div>
            </div>
            <div className="global-error__actions">
                <button
                    type="button"
                    className="button button--medium button--green global-error__button"
                    onClick={handleLearnMore}
                >
                    {translator.getMessage('global_error_learn_more')}
                </button>
                <button
                    type="button"
                    className="button button--medium button--link global-error__button"
                    onClick={handleTryAgain}
                >
                    {translator.getMessage('global_error_try_again')}
                </button>
            </div>
        </div>
    );
});
