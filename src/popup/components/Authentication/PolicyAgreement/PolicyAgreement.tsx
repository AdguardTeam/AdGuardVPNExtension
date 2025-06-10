import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { popupActions } from '../../../actions/popupActions';
import { getPrivacyAndEulaUrls } from '../../../../common/forwarderHelpers';
import { translator } from '../../../../common/translator';
import { reactTranslator } from '../../../../common/reactTranslator';
import vpnBlockedErrorNinjaImageUrl from '../../../../assets/images/vpn-blocked-error-ninja.svg';
import { rootStore } from '../../../stores';
import { Checkbox } from '../Checkbox';

import { PolicyAgreementModal } from './PolicyAgreementModal';

import './policy-agreement.pcss';

const POLICY_AGREEMENT_ID = 'policy_agreement';
const HELP_US_IMPROVE_ID = 'help_us_improve';

export const PolicyAgreement = observer(() => {
    const { authStore, settingsStore, uiStore } = useContext(rootStore);

    const { forwarderDomain } = settingsStore;
    const { openAgreementModal } = uiStore;

    const { eulaUrl, privacyUrl } = getPrivacyAndEulaUrls(forwarderDomain);

    const handlePrivacyClick = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
        e.preventDefault();
        await popupActions.openTab(privacyUrl);
    };

    const handleEulaClick = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
        e.preventDefault();
        await popupActions.openTab(eulaUrl);
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
        <div className="policy-agreement">
            <div className="policy-agreement__image-wrapper">
                <img
                    src={vpnBlockedErrorNinjaImageUrl}
                    alt="Reading Ninja"
                    className="policy-agreement__image"
                />
            </div>
            <div className="policy-agreement__content">
                <h1 className="policy-agreement__title">
                    {translator.getMessage('popup_auth_policy_agreement_title')}
                </h1>
                <div className="policy-agreement__checkbox">
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
                <div className="policy-agreement__checkbox">
                    <Checkbox
                        id={HELP_US_IMPROVE_ID}
                        checked={authStore.helpUsImprove}
                        onChange={onHelpUsImproveChanged}
                        label={reactTranslator.getMessage('popup_auth_help_us_improve_agreement', {
                            link: (chunks: string) => (
                                <a
                                    role="button"
                                    href="#"
                                    onClick={openAgreementModal}
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
                    className="button button--medium button--green form__btn policy-agreement__button"
                    disabled={!authStore.policyAgreement}
                >
                    {translator.getMessage('popup_auth_policy_agreement_continue_button')}
                </button>
            </div>
            <PolicyAgreementModal />
        </div>
    );
});
