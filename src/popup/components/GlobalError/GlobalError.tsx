import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { popupActions } from '../../actions/popupActions';
import { reactTranslator } from '../../../common/reactTranslator';
import { isLocationsNumberAcceptable } from '../../../common/is-locations-number-acceptable';
import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryScreenName } from '../../../background/telemetry';

import './global-error.pcss';

export const GlobalError = observer(() => {
    const {
        settingsStore,
        vpnStore,
        uiStore,
        telemetryStore,
    } = useContext(rootStore);

    const { isOpenOptionsModal, isShownVpnBlockedErrorDetails } = uiStore;

    const ERROR_TYPES = {
        PERMISSION: 'permission',
        CONTROL: 'control',
    };

    const ICON_TYPES = {
        ERROR: 'error',
        TROUBLE: 'trouble',
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
        await settingsStore.disableOtherProxyExtensions();
    };

    let errorType = ERROR_TYPES.PERMISSION;
    const descriptionClassName = 'global-error__description';

    if (settingsStore.hasGlobalError) {
        errorType = ERROR_TYPES.PERMISSION;
    }

    if (!settingsStore.canControlProxy) {
        errorType = ERROR_TYPES.CONTROL;
    }

    const canSendTelemetry = errorType === ERROR_TYPES.CONTROL
        && !isOpenOptionsModal // `MenuScreen` is rendered on top of this screen
        && !isShownVpnBlockedErrorDetails; // `DialogDesktopVersionPromo` is rendered on top of this screen

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DisableAnotherVpnExtensionScreen,
        canSendTelemetry,
    );

    const errorsMap = {
        [ERROR_TYPES.CONTROL]: {
            title: reactTranslator.getMessage('control_error_title'),
            description: reactTranslator.getMessage('control_error_description'),
            icon: ICON_TYPES.TROUBLE,
            buttons: [
                {
                    id: 1,
                    handler: handleDisableExtensions,
                    className: 'button button--medium button--green global-error__button',
                    text: reactTranslator.getMessage('control_error_disable'),
                },
            ],
        },
        [ERROR_TYPES.PERMISSION]: {
            title: reactTranslator.getMessage('global_error_title'),
            description: reactTranslator.getMessage('global_error_description'),
            icon: ICON_TYPES.ERROR,
            buttons: [
                {
                    id: 1,
                    handler: handleLearnMore,
                    text: reactTranslator.getMessage('global_error_learn_more'),
                    className: 'button button--medium button--green global-error__button',
                },
                {
                    id: 2,
                    handler: handleTryAgain,
                    className: 'button button--medium button--link global-error__button',
                    text: reactTranslator.getMessage('global_error_try_again'),
                },
            ],
        },
    };

    const {
        title, description, buttons, icon,
    } = errorsMap[errorType];

    const renderButtons = () => {
        return buttons.map((button) => {
            const {
                id,
                handler,
                className,
                text,
            } = button;

            return (
                <button
                    key={id}
                    type="button"
                    className={className}
                    onClick={handler}
                >
                    {text}
                </button>
            );
        });
    };

    return (
        <div className="global-error">
            {errorType === ERROR_TYPES.PERMISSION && (
                <div className="global-error__pic" />
            )}
            <div className="global-error__content">
                <div className={`global-error__icon global-error__icon--${icon}`} />
                {title && (
                    <div className="global-error__title">
                        {title}
                    </div>
                )}
                <div className={descriptionClassName}>
                    {description}
                </div>
            </div>
            <div className="global-error__actions">
                {renderButtons()}
            </div>
        </div>
    );
});
