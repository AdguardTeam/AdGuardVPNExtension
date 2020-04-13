import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import rootStore from '../../stores';
import popupActions from '../../actions/popupActions';

import './info-message.pcss';
import translator from '../../../lib/translator';
import { formatBytes } from '../../../lib/helpers';

const TRAFFIC_PERCENT = {
    DANGER: 25,
    WARNING: 50,
};

const InfoMessage = observer(() => {
    const { vpnStore, settingsStore } = useContext(rootStore);

    const onClick = (url) => (e) => {
        e.preventDefault();
        popupActions.openTab(url);
    };

    const {
        premiumPromoEnabled,
        premiumPromoPage,
        remainingTraffic,
        trafficUsingProgress,
    } = vpnStore;

    if (!premiumPromoEnabled) {
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

    const formattedRemainingTraffic = formatBytes(remainingTraffic);

    return (
        <div className="info-message">
            <div className="info-message__text">
                {settingsStore.hasLimitExceededError ? (
                    <span>{translator.translate('premium_limit_reached')}</span>
                ) : (
                    <>
                        <span className={`info-message__value ${getInfoColor()}`}>
                            {formattedRemainingTraffic.value}
                            &nbsp;
                            {formattedRemainingTraffic.unit}
                        </span>
                        &nbsp;remaining this month
                    </>
                )}
            </div>
            <a
                href={premiumPromoPage}
                type="button"
                className="button button--medium button--red-gradient info-message__btn"
                onClick={onClick(premiumPromoPage)}
            >
                {translator.translate('premium_upgrade')}
            </a>
            <div className="info-message__progress">
                <div
                    className={`info-message__progress-in ${getInfoColor()}`}
                    style={{ width: `${trafficUsingProgress}%` }}
                />
            </div>
        </div>
    );
});

export default InfoMessage;
