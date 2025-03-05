import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';

import { MobileEdgePromoBanner } from './MobileEdgePromoBanner';
import { MobileEdgePromoModal } from './MobileEdgePromoModal';

/**
 * Component for displaying mobile Edge promo.
 */
export const MobileEdgePromo = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const { isMobileEdgePromoBannerVisible } = settingsStore;

    const { shouldShowMobileEdgePromoModal } = uiStore;

    return (
        <>
            {isMobileEdgePromoBannerVisible
                // do not show the banner when the modal is displayed
                && !shouldShowMobileEdgePromoModal
                && <MobileEdgePromoBanner />}

            {shouldShowMobileEdgePromoModal
                && <MobileEdgePromoModal />}
        </>
    );
});
