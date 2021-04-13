import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../common/reactTranslator';
import { popupActions } from '../../actions/popupActions';
import { EULA_URL, PRIVACY_URL } from '../../../background/config';
import { rootStore } from '../../stores';
import { Checkbox } from './Checkbox';

const MARKETING_CONSENT_ID = 'marketing_consent';
const HELP_US_IMPROVE_ID = 'help_us_improve';

export const MarketingConsent = observer(() => {
    const { authStore, settingsStore } = useContext(rootStore);

    const handlePrivacyClick = async () => {
        await popupActions.openTab(PRIVACY_URL);
    };

    const handleEulaClick = async () => {
        await popupActions.openTab(EULA_URL);
    };

    const onMarketingConsentChange = (newValue) => {
        console.log('onMarketingConsentChange');
        console.log(newValue);
    };

    const handleAnonymousDataLinkClick = () => {
        // FIXME find out destination
        console.log('handleAnonymousDataLinkClick clicked');
    };

    const onHelpUsImproveChanged = () => {
        // FIXME
        console.log('onHelpUsImproveChanged');
    };

    return (
        <div className="auth">
            <div className="auth__container">
                <Checkbox
                    id={MARKETING_CONSENT_ID}
                    checked={authStore.marketingConsent}
                    onChange={onMarketingConsentChange}
                    label={reactTranslator.getMessage('popup_auth_marketing_agreement_consent', {
                        eula: (chunks) => (
                                <button
                                    type="button"
                                    onClick={handleEulaClick}
                                >
                                    {chunks}
                                </button>
                        ),
                        privacy: (chunks) => (
                                <button
                                    type="button"
                                    onClick={handlePrivacyClick}
                                >
                                    {chunks}
                                </button>
                        ),
                    })}
                />
                <Checkbox
                    id={HELP_US_IMPROVE_ID}
                    checked={settingsStore.helpUsImprove}
                    onChange={onHelpUsImproveChanged}
                    label={reactTranslator.getMessage('popup_auth_help_us_improve_agreement', {
                        link: (chunks) => (
                            <button
                                type="button"
                                onClick={handleAnonymousDataLinkClick}
                            >
                                {chunks}
                            </button>
                        ),
                    })}
                />
            </div>
        </div>
    );
});
