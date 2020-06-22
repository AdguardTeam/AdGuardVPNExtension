import React from 'react';

import popupActions from '../../actions/popupActions';
import { EULA_URL, PRIVACY_URL } from '../../../background/config';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

const Terms = () => {
    const handlePrivacyClick = async () => {
        await popupActions.openTab(PRIVACY_URL);
    };

    const handleEulaClick = async () => {
        await popupActions.openTab(EULA_URL);
    };

    return (
        <div className="auth__privacy">
            {reactTranslator.translate('popup_auth_agreement_consent', {
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
