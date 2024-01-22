import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';

import { VpnBlockedNotice } from './VpnBlockedNotice';
import { VpnBlockedDetails } from './VpnBlockedDetails';

export const VpnBlockedError = observer(() => {
    const { uiStore } = useContext(rootStore);

    const { isShownVpnBlockedErrorNotice, isShownVpnBlockedErrorDetails } = uiStore;

    return (
        <>
            {isShownVpnBlockedErrorNotice && <VpnBlockedNotice />}
            {isShownVpnBlockedErrorDetails && <VpnBlockedDetails />}
        </>
    );
});
