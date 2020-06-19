import React from 'react';

import popupActions from '../../actions/popupActions';
import { EULA_URL, PRIVACY_URL } from '../../../background/config';
import translator from '../../../lib/translator/translator';

const Terms = () => {
    const handlePrivacyClick = async () => {
        await popupActions.openTab(PRIVACY_URL);
    };

    const handleEulaClick = async () => {
        await popupActions.openTab(EULA_URL);
    };

    return (
        <div className="auth__privacy">
            {translator.translateReact('popup_auth_agreement_consent', {
                eula: (chunks) => (
                    <button
                        type="button"
                        tabIndex="-1"
                        className="auth__privacy-link"
                        onClick={handleEulaClick}
                    >
                        {chunks}
                    </button>
                ),
                privacy: (chunks) => (
                    <button
                        type="button"
                        tabIndex="-1"
                        className="auth__privacy-link"
                        onClick={handlePrivacyClick}
                    >
                        {chunks}
                    </button>
                ),
            })}
        </div>
    );
};

export default Terms;
