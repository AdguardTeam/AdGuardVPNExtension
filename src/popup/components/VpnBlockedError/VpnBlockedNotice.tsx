import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';

import './vpn-blocked-notice.pcss';

/**
 * Component to display notice about connection error.
 */
export const VpnBlockedNotice = observer(() => {
    const { uiStore } = useContext(rootStore);

    /**
     * Closes the error notice by changing the flag in the **settingsStore**.
     */
    const closeNotice = () => {
        uiStore.closeVpnBlockedErrorNotice();
    };

    /**
     * Opens connection error details by changing the flag in the uiStore.
     */
    const openDetails = () => {
        uiStore.openVpnBlockedErrorDetails();
    };

    return (
        <div className="vpn-blocked-notice">
            <button
                type="button"
                className="vpn-blocked-notice__warning-icon"
                tabIndex={-1}
            >
                <svg className="icon icon--button icon--warning">
                    <use xlinkHref="#warning" />
                </svg>
            </button>

            <button
                type="button"
                className="button button--icon modal__close-icon"
                onClick={closeNotice}
            >
                <svg className="icon icon--button icon--cross">
                    <use xlinkHref="#cross" />
                </svg>
            </button>

            <button
                type="button"
                className="vpn-blocked-notice__details-link"
                onClick={openDetails}
            >
                {reactTranslator.getMessage('popup_vpn_blocked_error_notice')}
            </button>
        </div>
    );
});
