import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { rootStore } from '../../../stores';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';
import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry';

export const TrafficLimitExceeded = observer(() => {
    const { vpnStore, settingsStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.SpeedReducedScreen,
    );

    const upgradeClickHandler = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
        e.preventDefault();
        telemetryStore.sendCustomEvent(
            TelemetryActionName.SpeedReducedPurchaseClick,
            TelemetryScreenName.SpeedReducedScreen,
        );
        await vpnStore.openPremiumPromoPage();
        window.close();
    };

    const handleClose = (e: React.MouseEvent<HTMLDivElement>): void => {
        e.preventDefault();
        settingsStore.setHasLimitExceededDisplayed();
    };

    return (
        <div className="global-error global-error--reduced">
            <div
                className="global-error__cancel"
                onClick={handleClose}
            >
                <svg className="icon icon--button">
                    <use xlinkHref="#cross" />
                </svg>
            </div>
            <div className="global-error__content global-error__content--centered">
                <div className="global-error__icon global-error__icon--reduced" />
                <div className="global-error__title">
                    {reactTranslator.getMessage('popup_traffic_limit_exceeded_title')}
                </div>
                <div className="global-error__description global-error__description--reduced">
                    {reactTranslator.getMessage('popup_traffic_limit_exceeded_description')}
                </div>
            </div>
            <div className="global-error__actions">
                <a
                    className="button button--medium button--green global-error__button global-error__button--reduced"
                    onClick={upgradeClickHandler}
                >
                    {reactTranslator.getMessage('popup_traffic_limit_exceeded_cta_btn')}
                </a>
            </div>
        </div>
    );
});
