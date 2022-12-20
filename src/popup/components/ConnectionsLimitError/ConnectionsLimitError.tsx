import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { CSSTransition } from 'react-transition-group';
import isNil from 'lodash/isNil';

import { log } from '../../../lib/logger';
import { rootStore } from '../../stores';
import { messenger } from '../../../lib/messenger';
import { reactTranslator } from '../../../common/reactTranslator';
import { FORWARDER_DOMAIN } from '../../../background/config';

import './popup-error.pcss';

export const ConnectionsLimitError = observer(() => {
    const { vpnStore } = useContext(rootStore);

    const { tooManyDevicesConnected, isPremiumToken, maxDevicesAllowed } = vpnStore;

    if (!tooManyDevicesConnected) {
        return null;
    }

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

    const description = `${descriptionFirstPart} ${descriptionRestPart}`;

    const buttonsMap = {
        free: { title: reactTranslator.getMessage('popup_connections_limit_description_cta_button_free'), url: `https://${FORWARDER_DOMAIN}/forward.html?action=subscribe&from=popup_connections_limit&app=vpn_extension` },
        premium: { title: reactTranslator.getMessage('popup_connections_limit_description_cta_button_premium'), url: `https://${FORWARDER_DOMAIN}/forward.html?action=devices_count&from=popup_connections_limit&app=vpn_extension` },
    };

    const buttonData = isPremiumToken ? buttonsMap.premium : buttonsMap.free;

    const handleCtaClick = (url: string) => async (): Promise<void> => {
        await messenger.openTab(url);
        window.close();
    };

    const handleCloseClick = (): void => {
        vpnStore.setTooManyDevicesConnected(false);
    };

    return (
        <CSSTransition
            in={tooManyDevicesConnected}
            timeout={300}
            classNames="fade"
            unmountOnExit
        >
            <div className="popup-error">
                <button className="button button--close popup-error__close" type="button" onClick={handleCloseClick}>
                    <svg className="icon icon--button">
                        <use xlinkHref="#cross" />
                    </svg>
                </button>
                <div className="popup-error__icon" />
                <div className="popup-error__title">
                    {reactTranslator.getMessage('popup_connections_limit_title')}
                </div>
                <div className="popup-error__description">{description}</div>
                <button
                    type="button"
                    className="button button--medium button--green"
                    onClick={handleCtaClick(buttonData.url)}
                >
                    {buttonData.title}
                </button>
            </div>
        </CSSTransition>
    );
});
