import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';

import { LimitedOfferNotice } from './LimitedOfferNotice';
import { LimitedOfferDetails } from './LimitedOfferDetails';

export const LimitedOfferModal = observer(() => {
    const { uiStore } = useContext(rootStore);

    const { shouldShowLimitedOfferNotice, shouldShowLimitedOfferDetails } = uiStore;

    return (
        <>
            {shouldShowLimitedOfferNotice && <LimitedOfferNotice />}
            {shouldShowLimitedOfferDetails && <LimitedOfferDetails />}
        </>
    );
});
