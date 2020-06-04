import React from 'react';

import popupActions from '../../actions/popupActions';
import { EULA_URL, PRIVACY_URL } from '../../../background/config';

// TODO translations
function Terms() {
    const handlePrivacyClick = async () => {
        await popupActions.openTab(PRIVACY_URL);
    };

    const handleEulaClick = async () => {
        await popupActions.openTab(EULA_URL);
    };

    return (
        <div className="auth__privacy">
            By using AdGuard VPN, you agree to&nbsp;
            <div>
                our&nbsp;
                <button
                    type="button"
                    tabIndex="-1"
                    className="auth__privacy-link"
                    onClick={handleEulaClick}
                >
                    EULA
                </button>
                &nbsp;and&nbsp;
                <button
                    type="button"
                    tabIndex="-1"
                    className="auth__privacy-link"
                    onClick={handlePrivacyClick}
                >
                    Privacy Policy
                </button>
            </div>
        </div>
    );
}

export default Terms;
