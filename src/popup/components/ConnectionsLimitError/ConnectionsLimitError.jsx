import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { CSSTransition } from 'react-transition-group';
import isNil from 'lodash/isNil';

import { log } from '../../../lib/logger';
import rootStore from '../../stores';
import messenger from '../../../lib/messenger';
import { reactTranslator } from '../../../common/reactTranslator';

export const ConnectionsLimitError = observer(() => {
    const { vpnStore } = useContext(rootStore);

    const { tooManyDevicesConnected, isPremiumToken, maxDevicesAllowed } = vpnStore;

    if (isNil(maxDevicesAllowed)) {
        log.error('Property maxDevicesAllowed is required');
        return null;
    }

    const descriptionFirstPart = reactTranslator.getMessage('popup_connections_limit_description_start', {
        maxDevicesAllowed,
    });

    let descriptionRestPart = reactTranslator.getMessage('popup_connections_limit_description_end_free');
    if (isPremiumToken) {
        descriptionRestPart = reactTranslator.getMessage('popup_connections_limit_description_end_premium');
    }

    const description = `${descriptionFirstPart}${descriptionRestPart}`;

    // FIXME add urls to the tds
    const buttonsMap = {
        free: { title: reactTranslator.getMessage('popup_connections_limit_description_cta_button_free'), url: 'https://adguard-vpn.com/ru/license.html' },
        premium: { title: reactTranslator.getMessage('popup_connections_limit_description_cta_button_premium'), url: 'https://adguard-vpn.com/welcome.html#devicesCount' },
    };

    const buttonData = isPremiumToken ? buttonsMap.premium : buttonsMap.free;

    const handleCtaClick = (url) => async () => {
        await messenger.openTab(url);
        window.close();
    };

    const handleCloseClick = () => {
        vpnStore.setTooManyDevicesConnected(false);
    };

    return (
        <CSSTransition
            in={tooManyDevicesConnected}
            timeout={300}
            classNames="fade"
            unmountOnExit
        >
            <>
                <button type="button" onClick={handleCloseClick}>close</button>
                <div className="title">
                    {reactTranslator.getMessage('popup_connections_limit_title')}
                </div>
                <div className="description">{description}</div>
                <button
                    type="button"
                    className="button"
                    onClick={handleCtaClick(buttonData.url)}
                >
                    {buttonData.title}
                </button>
            </>
        </CSSTransition>
    );
});
