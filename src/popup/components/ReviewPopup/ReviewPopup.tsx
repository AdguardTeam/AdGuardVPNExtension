import React, { type ReactElement } from 'react';

import { RateModal } from './RateModal';
import { ConfirmRateModal } from './ConfirmRateModal';

export const ReviewPopup = (): ReactElement => {
    return (
        <>
            <RateModal />
            <ConfirmRateModal />
        </>
    );
};
