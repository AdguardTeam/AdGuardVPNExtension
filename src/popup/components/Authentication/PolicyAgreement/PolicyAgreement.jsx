import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { popupActions } from '../../../actions/popupActions';
import { EULA_URL, PRIVACY_URL } from '../../../../background/config';
import { rootStore } from '../../../stores';
import { Checkbox } from '../Checkbox';

const POLICY_AGREEMENT_ID = 'policy_agreement';
const HELP_US_IMPROVE_ID = 'help_us_improve';

export const PolicyAgreement = observer(() => {
    const { authStore } = useContext(rootStore);

    const handlePrivacyClick = async () => {
        await popupActions.openTab(PRIVACY_URL);
    };

    const handleEulaClick = async () => {
        await popupActions.openTab(EULA_URL);
    };

    const handleAnonymousDataLinkClick = async () => {
        await popupActions.openTab(PRIVACY_URL);
    };

    const onPolicyAgreementChange = async (value) => {
        await authStore.setPolicyAgreement(value);
    };

    const onHelpUsImproveChanged = async (value) => {
        await authStore.setHelpUsImprove(value);
    };

    const handleContinueClick = async () => {
        await authStore.onPolicyAgreementReceived();
    };

    return (
        <>
            <Checkbox
                id={POLICY_AGREEMENT_ID}
                checked={authStore.policyAgreement}
                onChange={onPolicyAgreementChange}
                label={reactTranslator.getMessage('popup_auth_policy_agreement', {
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
                checked={authStore.helpUsImprove}
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
            <button
                type="button"
                onClick={handleContinueClick}
                disabled={!authStore.policyAgreement}
            >
                {reactTranslator.getMessage('popup_auth_policy_agreement_continue_button')}
            </button>
        </>
    );
});
