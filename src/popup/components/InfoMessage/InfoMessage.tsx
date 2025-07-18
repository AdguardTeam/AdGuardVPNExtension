import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { reactTranslator } from '../../../common/reactTranslator';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../stores';

import { TrafficInfo } from './TrafficInfo';

import './info-message.pcss';

const TRAFFIC_PERCENT = {
    DANGER: 25,
    WARNING: 50,
};

export const InfoMessage = observer(() => {
    const { vpnStore, settingsStore, telemetryStore } = useContext(rootStore);

    const upgradeClickHandler = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        telemetryStore.sendCustomEvent(
            TelemetryActionName.PurchaseClick,
            TelemetryScreenName.HomeScreen,
        );
        await vpnStore.openPremiumPromoPage();
        // close popup after click on upgrade button
        window.close();
    };

    const {
        premiumPromoEnabled,
        trafficUsingProgress,
        isPremiumToken,
    } = vpnStore;

    // If user has premium token we do not show any info messages
    if (!premiumPromoEnabled || isPremiumToken) {
        return null;
    }

    const getInfoColor = () => {
        if (trafficUsingProgress < TRAFFIC_PERCENT.DANGER) {
            return 'red';
        }

        if (trafficUsingProgress < TRAFFIC_PERCENT.WARNING) {
            return 'yellow';
        }

        return 'green';
    };

    const infoMessagesClass = classnames(
        'info-message',
        { 'info-message--active': settingsStore.isConnected },
    );

    return (
        <div className={infoMessagesClass}>
            <div className="info-message__text-wr">
                <div className="info-message__text">
                    <TrafficInfo />
                </div>
                <button
                    type="button"
                    className="button button--medium button--red button--info-message info-message__btn"
                    onClick={upgradeClickHandler}
                >
                    {reactTranslator.getMessage('premium_upgrade')}
                </button>
            </div>
            <div className="info-message__progress">
                <div
                    className={`info-message__progress-in ${getInfoColor()}`}
                    style={{ width: `${trafficUsingProgress}%` }}
                />
            </div>
        </div>
    );
});
