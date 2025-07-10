import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';
import { CSSTransition } from 'react-transition-group';

import isNil from 'lodash/isNil';

import { getForwarderUrl } from '../../../common/helpers';
import { log } from '../../../common/logger';
import { rootStore } from '../../stores';
import { messenger } from '../../../common/messenger';
import { translator } from '../../../common/translator';
import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { IconButton } from '../../../common/components/Icons';
import { TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import confusedImageUrl from '../../../assets/images/confused.svg';

export const ConnectionsLimitError = observer(() => {
    const { vpnStore, settingsStore, telemetryStore } = useContext(rootStore);
    const nodeRef = useRef<HTMLDivElement>(null);

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

    const descriptionFirstPart = translator.getMessage('popup_connections_limit_description_start', {
        maxDevicesAllowed,
    });

    let descriptionRestPart = translator.getMessage('popup_connections_limit_description_end_free');
    if (isPremiumToken) {
        descriptionRestPart = translator.getMessage('popup_connections_limit_description_end_premium');
    }

    const description = `${descriptionFirstPart} ${descriptionRestPart}`;

    const deviceCountUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.DEVICE_COUNT);

    const openDeviceCountPage = async (): Promise<void> => {
        await messenger.openTab(deviceCountUrl);
        window.close();
    };

    const buttonsMap = {
        free: {
            title: translator.getMessage('popup_connections_limit_description_cta_button_free'),
            onClick: openSubscribePromoPage,
        },
        premium: {
            title: translator.getMessage('popup_connections_limit_description_cta_button_premium'),
            onClick: openDeviceCountPage,
        },
    };

    const buttonData = isPremiumToken ? buttonsMap.premium : buttonsMap.free;

    const handleCloseClick = (): void => {
        vpnStore.setTooManyDevicesConnected(false);
    };

    return (
        <CSSTransition
            nodeRef={nodeRef}
            in={tooManyDevicesConnected}
            timeout={300}
            classNames="fade"
            unmountOnExit
        >
            <div ref={nodeRef} className="new-global-error new-global-error--device">
                <IconButton
                    name="cross"
                    className="close-icon-btn"
                    onClick={handleCloseClick}
                />
                <div className="new-global-error__image-wrapper">
                    <img
                        src={confusedImageUrl}
                        className="new-global-error__image"
                        alt="Confused Ninja"
                    />
                </div>
                <div className="new-global-error__content">
                    <div className="new-global-error__title">
                        {translator.getMessage('popup_connections_limit_title')}
                    </div>
                    <div className="new-global-error__description">
                        {description}
                    </div>
                    <button
                        type="button"
                        onClick={buttonData.onClick}
                        className="button button--large button--green"
                    >
                        {buttonData.title}
                    </button>
                </div>
            </div>
        </CSSTransition>
    );
});
