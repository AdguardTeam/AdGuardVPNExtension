import React, { useContext } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import rootStore from '../../../stores';

import './endpoint.pcss';
import { PROMO_SCREEN_STATES } from '../../../../lib/constants';
import Ping from '../../Ping';

const CurrentEndpoint = observer(() => {
    const { vpnStore, settingsStore, uiStore } = useContext(rootStore);

    const {
        countryNameToDisplay,
        cityNameToDisplay,
        countryCodeToDisplay,
        selectedLocationPing,
    } = vpnStore;

    const { isConnected } = settingsStore;

    const setSaleVisibleHandler = async () => {
        await settingsStore.setSalePromoStatus(PROMO_SCREEN_STATES.DISPLAY_ON_POPUP_OPEN);
    };

    const clickHandler = (e) => {
        e.preventDefault();
        if (!vpnStore.isPremiumToken
            && settingsStore.promoScreenState === PROMO_SCREEN_STATES.DISPLAY_AFTER_CONNECT_CLICK) {
            setSaleVisibleHandler();
        }
        uiStore.openEndpointsSearch();
    };

    const iconClass = classnames('flag', { 'flag--active': isConnected });

    const getFlagIconStyle = (countryCode) => {
        if (!countryCode) {
            return {};
        }
        const iconName = countryCode.toLowerCase();
        return { backgroundImage: `url("../../assets/images/flags/${iconName}.svg")` };
    };

    const renderPing = () => {
        if (selectedLocationPing) {
            return <Ping ping={selectedLocationPing} />;
        }

        return <div className="ping">-</div>;
    };

    return (
        <div
            className="endpoint"
            onClick={clickHandler}
        >
            <div className="endpoint__country">
                <div className={iconClass}>
                    <span className="flag__icon" style={getFlagIconStyle(countryCodeToDisplay)} />
                </div>
            </div>
            <div className="endpoint__info">
                <div className="endpoint__title">
                    {countryNameToDisplay}
                </div>
                <div className="endpoint__desc">
                    {cityNameToDisplay}
                </div>
            </div>
            {renderPing()}
        </div>
    );
});

export default CurrentEndpoint;
