import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { rootStore } from '../../../stores';

const TrafficLimitExceeded = observer(() => {
    const { vpnStore, settingsStore } = useContext(rootStore);

    const upgradeClickHandler = async (e) => {
        e.preventDefault();
        await vpnStore.openPremiumPromoPage();
        window.close();
    };

    const handleClose = (e) => {
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
                <div className="global-error__title global-error__title--regular">
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

export { TrafficLimitExceeded };
