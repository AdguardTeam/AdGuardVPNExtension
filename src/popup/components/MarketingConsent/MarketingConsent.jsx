import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../common/reactTranslator';
import { popupActions } from '../../actions/popupActions';
import { EULA_URL, PRIVACY_URL } from '../../../background/config';
import { rootStore } from '../../stores';

const MARKETING_CONSENT_ID = 'marketing_consent';

export const MarketingConsent = observer(() => {
    const { authStore } = useContext(rootStore);

    const handlePrivacyClick = async () => {
        await popupActions.openTab(PRIVACY_URL);
    };

    const handleEulaClick = async () => {
        await popupActions.openTab(EULA_URL);
    };

    const onMarketingConsentChange = (e) => {
        console.log('onMarketingConsentChange');
        console.log(e.target.checked);
    };

    return (
        <div className="auth">
            <div className="auth__container">
                <label htmlFor={MARKETING_CONSENT_ID}>
                    {reactTranslator.getMessage('popup_auth_marketing_agreement_consent', {
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
                </label>
                <input
                    id={MARKETING_CONSENT_ID}
                    name={MARKETING_CONSENT_ID}
                    type="checkbox"
                    checked={authStore.marketingConsent}
                    onChange={onMarketingConsentChange}
                />
            </div>
        </div>
    );
});
