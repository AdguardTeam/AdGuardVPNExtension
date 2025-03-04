import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { CSSTransition } from 'react-transition-group';

import isNil from 'lodash/isNil';

import { getForwarderUrl } from '../../../common/helpers';
import { log } from '../../../common/logger';
import { rootStore } from '../../stores';
import { messenger } from '../../../common/messenger';
import { reactTranslator } from '../../../common/reactTranslator';
import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryScreenName } from '../../../background/telemetry';

import './popup-error.pcss';

export const ConnectionsLimitError = observer(() => {
    const { vpnStore, settingsStore, telemetryStore } = useContext(rootStore);

    const {
        tooManyDevicesConnected,
        isPremiumToken,
        maxDevicesAllowed,
        openSubscribePromoPage,
    } = vpnStore;

    const isMaxDevicesAllowedCorrect = !isNil(maxDevicesAllowed);

    const isRendered = tooManyDevicesConnected && isMaxDevicesAllowedCorrect;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DeviceLimitScreen,
        isRendered,
    );

    const { forwarderDomain } = settingsStore;

    if (!tooManyDevicesConnected) {
        return null;
    }

    if (!isMaxDevicesAllowedCorrect) {
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

    const deviceCountUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.DEVICE_COUNT);

    const openDeviceCountPage = async (): Promise<void> => {
        await messenger.openTab(deviceCountUrl);
        window.close();
    };

    const buttonsMap = {
        free: {
            title: reactTranslator.getMessage('popup_connections_limit_description_cta_button_free'),
            onClick: openSubscribePromoPage,
        },
        premium: {
            title: reactTranslator.getMessage('popup_connections_limit_description_cta_button_premium'),
            onClick: openDeviceCountPage,
        },
    };

    const buttonData = isPremiumToken ? buttonsMap.premium : buttonsMap.free;

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
                    onClick={buttonData.onClick}
                >
                    {buttonData.title}
                </button>
            </div>
        </CSSTransition>
    );
});
