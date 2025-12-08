import React, { type ReactElement, useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { navActions } from '../../../common/actions/navActions';
import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { messenger } from '../../../common/messenger';
import { getForwarderUrl } from '../../../common/helpers';
import { reactTranslator } from '../../../common/reactTranslator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { Prefs } from '../../../common/prefs';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { RatePopup } from '../RatePopup';
import { StatsMenuItem } from '../Stats';

import { Option } from './Option';

import './extra-options.pcss';

export const ExtraOptions = observer(() => {
    const { uiStore, settingsStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.MenuScreen,
    );

    const {
        isRateVisible,
        hasDesktopAppForOs,
        forwarderDomain,
        isAndroidBrowser,
    } = settingsStore;

    /**
     * Whether to display the mobile Edge promo menu item — for desktop Edge only.
     */
    const shouldShouldMobileEdgePromoMenuItem = !isAndroidBrowser
        && Prefs.isEdge();

    const openSettings = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.SettingsClick,
            TelemetryScreenName.MenuScreen,
        );
        await messenger.openOptionsPage();
        window.close();
    };

    const handleFeedback = async (): Promise<void> => {
        await navActions.openTab(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.POPUP_FEEDBACK));
    };

    /**
     * Handles the click on the mobile Edge promo menu item —
     * opens the mobile Edge promo modal
     * and closes the options modal (i.e. opened popup menu).
     */
    const handleMobileEdgePromoClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.MenuGetAndroidClick,
            TelemetryScreenName.MenuScreen,
        );
        uiStore.openMobileEdgePromoModal();
        uiStore.closeOptionsModal();
    };

    const handleOtherProductsClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OtherProductsClick,
            TelemetryScreenName.MenuScreen,
        );
        await navActions.openTab(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.OTHER_PRODUCTS));
    };

    const openComparePage = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.WhyDesktopClick,
            TelemetryScreenName.MenuScreen,
        );
        navActions.openTab(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.COMPARE_PAGE));
    };

    const renderOption = (key: string, handler: () => void, className: string | null = null): ReactElement => {
        return (
            <Option
                text={reactTranslator.getMessage(key)}
                handler={handler}
                addClassName={className}
            />
        );
    };

    return (
        <Modal
            isOpen={uiStore.isOpenOptionsModal}
            shouldCloseOnOverlayClick
            onRequestClose={uiStore.closeOptionsModal}
            className="extra-options"
            overlayClassName="modal__overlay extra-options__overlay"
        >
            {shouldShouldMobileEdgePromoMenuItem
                && renderOption('popup_mobile_edge_promo_text', handleMobileEdgePromoClick)}

            {renderOption('popup_settings_other_products', handleOtherProductsClick)}

            {renderOption('popup_settings_open_settings', openSettings)}

            <StatsMenuItem />

            {hasDesktopAppForOs
                && renderOption('popup_compare_button', openComparePage, 'extra-options__item--compare')}

            {isRateVisible
                ? <RatePopup />
                : renderOption('popup_settings_feedback', handleFeedback)}
        </Modal>
    );
});
