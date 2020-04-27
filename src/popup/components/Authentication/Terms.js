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
            By continuing you accept the&nbsp;
            <div>
                <button
                    type="button"
                    tabIndex="-1"
                    className="auth__privacy-link"
                    onClick={handlePrivacyClick}
                >
                    Terms and Conditions
                </button>
                &nbsp;and&nbsp;
                <button
                    type="button"
                    tabIndex="-1"
                    className="auth__privacy-link"
                    onClick={handleEulaClick}
                >
                    EULA
                </button>
            </div>
        </div>
    );
}

export default Terms;
