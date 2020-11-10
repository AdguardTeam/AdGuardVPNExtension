import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import rootStore from '../../stores';
import './info-message.pcss';
import { formatBytes } from '../../../lib/helpers';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

const TRAFFIC_PERCENT = {
    DANGER: 25,
    WARNING: 50,
};

const InfoMessage = observer(() => {
    const { vpnStore, settingsStore } = useContext(rootStore);

    const upgradeClickHandler = async (e) => {
        e.preventDefault();
        await vpnStore.openPremiumPromoPage();
    };

    const {
        premiumPromoEnabled,
        remainingTraffic,
        trafficUsingProgress,
        isPremiumToken,
    } = vpnStore;

    // If user has premium token we do not show any info messages
    if (!premiumPromoEnabled || isPremiumToken || settingsStore.hasLimitExceededError) {
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
        { 'info-message--active': settingsStore.proxyEnabled },
    );

    const formattedRemainingTraffic = formatBytes(remainingTraffic);

    return (
        <div className={infoMessagesClass}>
            <div className="info-message__text-wr">
                <div className="info-message__text">
                    {
                        settingsStore.hasLimitExceededError
                            ? (<span>{reactTranslator.translate('popup_traffic_limit_reached')}</span>)
                            : reactTranslator.translate('popup_free_traffic_info', {
                                value: formattedRemainingTraffic.value,
                                unit: formattedRemainingTraffic.unit,
                                span: (chunks) => (<span className={`info-message__value ${getInfoColor()}`}>{chunks}</span>),
                            })
                    }
                </div>
                <a
                    type="button"
                    className="button button--medium button--red info-message__btn"
                    onClick={upgradeClickHandler}
                >
                    {reactTranslator.translate('premium_upgrade')}
                </a>
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

export default InfoMessage;
