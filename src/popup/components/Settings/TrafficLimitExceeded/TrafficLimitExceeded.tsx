import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translator';
import { rootStore } from '../../../stores';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';
import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry';
import { Icon } from '../../ui/Icon';

export const TrafficLimitExceeded = observer(() => {
    const { vpnStore, settingsStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.SpeedReducedScreen,
    );

    const upgradeClickHandler = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();
        telemetryStore.sendCustomEvent(
            TelemetryActionName.SpeedReducedPurchaseClick,
            TelemetryScreenName.SpeedReducedScreen,
        );
        await vpnStore.openPremiumPromoPage();
        window.close();
    };

    const handleClose = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        telemetryStore.sendCustomEvent(
            TelemetryActionName.CloseSpeedReducesClick,
            TelemetryScreenName.SpeedReducedScreen,
        );
        settingsStore.setHasLimitExceededDisplayed();
    };

    return (
        <div className="new-global-error new-global-error--reduced">
            <button
                type="button"
                onClick={handleClose}
                className="new-global-error__close-btn"
            >
                <Icon icon="cross" className="icon--button" />
            </button>
            <div className="new-global-error__image-wrapper">
                <img
                    src="../../../assets/images/tired.svg"
                    className="new-global-error__image"
                    alt="Slow Ninja"
                />
            </div>
            <div className="new-global-error__content">
                <div className="new-global-error__title">
                    {translator.getMessage('popup_traffic_limit_exceeded_title')}
                </div>
                <div className="new-global-error__description">
                    {translator.getMessage('popup_traffic_limit_exceeded_description')}
                </div>
                <button
                    type="button"
                    onClick={upgradeClickHandler}
                    className="button button--large button--green"
                >
                    {translator.getMessage('popup_traffic_limit_exceeded_cta_btn')}
                </button>
            </div>
        </div>
    );
});
