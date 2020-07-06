import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import rootStore from '../../stores';
import popupActions from '../../actions/popupActions';
import './info-message.pcss';
import { formatBytes } from '../../../lib/helpers';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

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
        { 'info-message--active': settingsStore.proxyEnabled }
    );

    const formattedRemainingTraffic = formatBytes(remainingTraffic);

    return (
        <div className={ infoMessagesClass }>
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
                <div className="info-message__progress">
                    <div
                        className={`info-message__progress-in ${getInfoColor()}`}
                        style={{ width: `${trafficUsingProgress}%` }}
                    />
                </div>
            </div>
            <a
                href={premiumPromoPage}
                type="button"
                className="button button--medium button--red info-message__btn"
                onClick={onClick(premiumPromoPage)}
            >
                {reactTranslator.translate('premium_upgrade')}
            </a>
        </div>
    );
});

export default InfoMessage;
