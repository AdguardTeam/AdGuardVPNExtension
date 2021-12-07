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

    const handlePrivacyClick = async (e) => {
        e.preventDefault();
        await popupActions.openTab(PRIVACY_URL);
    };

    const handleEulaClick = async (e) => {
        e.preventDefault();
        await popupActions.openTab(EULA_URL);
    };

    const handleAnonymousDataLinkClick = async (e) => {
        e.preventDefault();
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
            <div className="logo auth__logo" />
            <div className="form__group form__group--wide">
                <Checkbox
                    id={POLICY_AGREEMENT_ID}
                    checked={authStore.policyAgreement}
                    onChange={onPolicyAgreementChange}
                    label={reactTranslator.getMessage('popup_auth_policy_agreement', {
                        eula: (chunks) => (
                            <a
                                onClick={handleEulaClick}
                                className="button button--link-green"
                            >
                                {chunks}
                            </a>
                        ),
                        privacy: (chunks) => (
                            <a
                                onClick={handlePrivacyClick}
                                className="button button--link-green"
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                />
            </div>
            <div className="form__group form__group--last form__group--wide">
                <Checkbox
                    id={HELP_US_IMPROVE_ID}
                    checked={authStore.helpUsImprove}
                    onChange={onHelpUsImproveChanged}
                    label={reactTranslator.getMessage('popup_auth_help_us_improve_agreement', {
                        link: (chunks) => (
                            <a
                                onClick={handleAnonymousDataLinkClick}
                                className="button button--link-green"
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                />
            </div>
            <button
                type="button"
                onClick={handleContinueClick}
                className="button button--medium button--green form__btn"
                disabled={!authStore.policyAgreement}
            >
                {reactTranslator.getMessage('popup_auth_policy_agreement_continue_button')}
            </button>
        </>
    );
});
