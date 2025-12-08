import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { navActions } from '../../../common/actions/navActions';
import { getPrivacyAndEulaUrls } from '../../../common/forwarderHelpers';
import { translator } from '../../../common/translator';
import { reactTranslator } from '../../../common/reactTranslator';
import vpnBlockedErrorNinjaImageUrl from '../../../assets/images/vpn-blocked-error-ninja.svg';
import { rootStore } from '../../stores';
import { Icon } from '../../../common/components/Icons';
import { WebAuthState } from '../../../background/auth/webAuthEnums';

import { Checkbox } from './Checkbox';
import { UsageDataModal } from './UsageDataModal';
import { FailedToLoginModal } from './FailedToLoginModal';

import './auth.pcss';

const POLICY_AGREEMENT_ID = 'policy_agreement';
const HELP_US_IMPROVE_ID = 'help_us_improve';

/**
 * Authentication component.
 */
export const Authentication = observer(() => {
    const { authStore, settingsStore, uiStore } = useContext(rootStore);

    const { forwarderDomain } = settingsStore;
    const { openUsageDataModal } = uiStore;
    const {
        policyAgreement,
        helpUsImprove,
        webAuthFlowState,
        setPolicyAgreement,
        setHelpUsImprove,
        onPolicyAgreementReceived,
        startWebAuthFlow,
        reopenWebAuthFlow,
        cancelWebAuthFlow,
    } = authStore;

    const isWebAuthFlowStarted = webAuthFlowState !== WebAuthState.Idle;
    const isWebAuthFlowLoading = webAuthFlowState === WebAuthState.Loading;

    const { eulaUrl, privacyUrl } = getPrivacyAndEulaUrls(forwarderDomain);

    const handlePrivacyClick = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
        e.preventDefault();
        await navActions.openTab(privacyUrl);
    };

    const handleEulaClick = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
        e.preventDefault();
        await navActions.openTab(eulaUrl);
    };

    const onPolicyAgreementChange = async (value: boolean): Promise<void> => {
        await setPolicyAgreement(value);
    };

    const onHelpUsImproveChanged = async (value: boolean): Promise<void> => {
        await setHelpUsImprove(value);
    };

    /**
     * Close current popup window to let user focus on the opened tab.
     * In all desktop browsers it closed automatically, but in Android
     * it stays open, so we need to close it manually to make sure that it's closed.
     */
    const closePopup = (): void => {
        window.close();
    };

    const handleContinueClick = async (): Promise<void> => {
        await onPolicyAgreementReceived();
        await startWebAuthFlow();
        closePopup();
    };

    const handleReopenClick = async (): Promise<void> => {
        await reopenWebAuthFlow();
        closePopup();
    };

    if (isWebAuthFlowStarted) {
        return (
            <div className="auth-loading">
                <div className="auth-loading__content">
                    {isWebAuthFlowLoading && (
                        <Icon
                            name="spinner"
                            color="product"
                            size="48"
                            className="auth-loading__spinner"
                        />
                    )}
                    <h2 className="auth-loading__title">
                        {translator.getMessage('auth_loading_title')}
                    </h2>
                    <p className="auth-loading__description">
                        {translator.getMessage('auth_loading_description')}
                    </p>
                </div>
                <div className="auth-loading__actions">
                    <button
                        type="button"
                        className="button button--medium button--green auth-loading__button"
                        onClick={handleReopenClick}
                    >
                        {translator.getMessage('auth_loading_button_reopen')}
                    </button>
                    <button
                        type="button"
                        className="button button--medium button--transparent auth-loading__button"
                        onClick={cancelWebAuthFlow}
                    >
                        {translator.getMessage('auth_loading_button_cancel')}
                    </button>
                </div>
                <FailedToLoginModal />
            </div>
        );
    }

    return (
        <div className="auth">
            <div className="auth__image-wrapper">
                <img
                    src={vpnBlockedErrorNinjaImageUrl}
                    alt="Reading Ninja"
                    className="auth__image"
                />
            </div>
            <div className="auth__content">
                <h1 className="auth__title">
                    {translator.getMessage('popup_auth_policy_agreement_title')}
                </h1>
                <div className="auth__checkbox">
                    <Checkbox
                        id={POLICY_AGREEMENT_ID}
                        checked={policyAgreement}
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
                <div className="auth__checkbox">
                    <Checkbox
                        id={HELP_US_IMPROVE_ID}
                        checked={helpUsImprove}
                        onChange={onHelpUsImproveChanged}
                        label={reactTranslator.getMessage('popup_auth_help_us_improve_agreement', {
                            link: (chunks: string) => (
                                <a
                                    role="button"
                                    href="#"
                                    onClick={openUsageDataModal}
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
                    className="button button--medium button--green auth__button"
                    disabled={!policyAgreement}
                >
                    {translator.getMessage('popup_auth_policy_agreement_continue_button')}
                </button>
            </div>
            <UsageDataModal />
            <FailedToLoginModal />
        </div>
    );
});
