import React, { useContext, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { translator } from '../../../common/translator';
import { Icon, IconButton } from '../../../common/components/Icons';
import { rootStore } from '../../stores';

import './mobile-edge-promo-banner.pcss';

/**
 * Component to display the mobile Edge promo banner.
 */
export const MobileEdgePromoBanner = observer(() => {
    const ref = useRef<HTMLDivElement>(null);
    const { settingsStore, telemetryStore, uiStore } = useContext(rootStore);

    /**
     * Sets the height of the mobile Edge promo banner in the CSS variable.
     * This is needed to adjust the height of UI elements when the banner is displayed.
     */
    useEffect(() => {
        const MOBILE_EDGE_PROMO_HEIGHT_VAR = 'mobile-edge-promo-height';
        const height = ref.current?.getBoundingClientRect().height || 0;

        document.documentElement.style.setProperty(`--${MOBILE_EDGE_PROMO_HEIGHT_VAR}`, `${height}px`);

        return (): void => {
            document.documentElement.style.removeProperty(`--${MOBILE_EDGE_PROMO_HEIGHT_VAR}`);
        };
    }, []);

    /**
     * Opens the mobile Edge promo modal.
     */
    const openModal = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OpenAndroidPromoClick,
            TelemetryScreenName.HomeScreen,
        );
        uiStore.openMobileEdgePromoModal();
    };

    /**
     * Closes the mobile Edge promo banner.
     */
    const closeBanner = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.CloseAndroidPromoClick,
            TelemetryScreenName.HomeScreen,
        );
        await settingsStore.hideMobileEdgePromoBanner();
    };

    return (
        <div ref={ref} className="mobile-edge-promo-banner">
            <button
                type="button"
                className="mobile-edge-promo-banner__btn"
                onClick={openModal}
            >
                <span className="mobile-edge-promo-banner__text">
                    {translator.getMessage('popup_mobile_edge_promo_text')}
                </span>
                <Icon name="arrow-down" rotation="clockwise" />
            </button>

            <IconButton name="cross" onClick={closeBanner} />
        </div>
    );
});
