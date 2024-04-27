import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { popupActions } from '../../../actions/popupActions';
import { getForwarderUrl } from '../../../../common/helpers';
import { reactTranslator } from '../../../../common/reactTranslator';
import { FORWARDER_URL_QUERIES } from '../../../../background/config';
import { rootStore } from '../../../stores';
import { Checkbox } from '../Checkbox';

const POLICY_AGREEMENT_ID = 'policy_agreement';
const HELP_US_IMPROVE_ID = 'help_us_improve';

export const PolicyAgreement = observer(() => {
    const { authStore, settingsStore } = useContext(rootStore);

    const { forwarderDomain } = settingsStore;

    const eulaUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.EULA);
    const privacyUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.PRIVACY);

    const handlePrivacyClick = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
        e.preventDefault();
        await popupActions.openTab(privacyUrl);
    };

    const handleEulaClick = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
        e.preventDefault();
        await popupActions.openTab(eulaUrl);
    };

    const handleAnonymousDataLinkClick = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
        e.preventDefault();
        await popupActions.openTab(privacyUrl);
    };

    const onPolicyAgreementChange = async (value: boolean): Promise<void> => {
        await authStore.setPolicyAgreement(value);
    };

    const onHelpUsImproveChanged = async (value: boolean): Promise<void> => {
        await authStore.setHelpUsImprove(value);
    };

    const handleContinueClick = async (): Promise<void> => {
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
                        eula: (chunks: string) => (
                            <a
                                href={eulaUrl}
                                onClick={handleEulaClick}
                                className="button button--link-green"
                                target="_blank"
                                rel="noreferrer"
                            >
                                {chunks}
                            </a>
                        ),
                        privacy: (chunks: string) => (
                            <a
                                href={privacyUrl}
                                onClick={handlePrivacyClick}
                                className="button button--link-green"
                                target="_blank"
                                rel="noreferrer"
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
                        link: (chunks: string) => (
                            <a
                                href={privacyUrl}
                                onClick={handleAnonymousDataLinkClick}
                                className="button button--link-green"
                                target="_blank"
                                rel="noreferrer"
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
