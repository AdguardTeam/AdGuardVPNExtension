import React, { useContext } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import rootStore from '../../../stores';

import './endpoint.pcss';

const CurrentEndpoint = observer(() => {
    const { vpnStore, settingsStore, uiStore } = useContext(rootStore);

    const {
        countryNameToDisplay,
        cityNameToDisplay,
        countryCodeToDisplay,
    } = vpnStore;

    const { isConnected } = settingsStore;

    const isSaleHandler = async () => {
        await settingsStore.setSaleVisible({ visible: true, setHide: false });
    };

    const clickHandler = (e) => {
        e.preventDefault();
        if (settingsStore.saleVisibleState && !settingsStore.saleVisibleState.setHide) {
            isSaleHandler();
            return;
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
        </div>
    );
});

export default CurrentEndpoint;
