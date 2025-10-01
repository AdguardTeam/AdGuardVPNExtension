/* eslint-disable react/no-unstable-nested-components */
import React, { type ReactElement, useEffect, useState } from 'react';

import { AuthCacheKey } from '../../background/authentication/authCacheTypes';
import { WebAuthAction, WebAuthState } from '../../background/auth/webAuthEnums';
import { FORWARDER_URL_QUERIES } from '../../background/config';
import { type NotifierMessage, messenger } from '../../common/messenger';
import { translator } from '../../common/translator';
import { reactTranslator } from '../../common/reactTranslator';
import { getPrivacyAndEulaUrls } from '../../common/forwarderHelpers';
import { Icon, Icons } from '../../common/components/Icons';
import { notifier } from '../../common/notifier';
import { useSubscribeNotifier } from '../../common/hooks/useSubscribeNotifier';
import { getForwarderUrl } from '../../common/helpers';
import { Checkbox } from '../../options/components/ui/Checkbox';
import { Button } from '../../options/components/ui/Button';
import vpnBlockedErrorNinjaImageUrl from '../../assets/images/vpn-blocked-error-ninja.svg';

import { UsageDataModal } from './UsageDataModal';
import { FailedToLoginModal } from './FailedToLoginModal';

import '../../options/styles/main.pcss';
import './app.pcss';

/**
 * List of notifier events to subscribe for.
 */
const NOTIFIER_EVENTS = [
    notifier.types.AUTH_CACHE_UPDATED,
    notifier.types.USER_AUTHENTICATED,
];

/**
 * Consent page main component.
 */
export function App(): ReactElement {
    // Retrieved from background
    const [policyAgreement, setPolicyAgreement] = useState(false);
    const [helpUsImprove, setHelpUsImprove] = useState(false);
    const [eulaUrl, setEulaUrl] = useState<string | undefined>(undefined);
    const [privacyUrl, setPrivacyUrl] = useState<string | undefined>(undefined);
    const [supportUrl, setSupportUrl] = useState<string | undefined>(undefined);
    const [webAuthFlowState, setWebAuthFlowState] = useState(WebAuthState.Idle);

    // Local state
    const [isUsageDataModalOpen, setIsUsageDataModalOpen] = useState(false);

    const isWebAuthFlowStarted = webAuthFlowState !== WebAuthState.Idle;
    const isWebAuthFlowLoading = webAuthFlowState === WebAuthState.Loading;
    const isWebAuthFailedByUser = webAuthFlowState === WebAuthState.FailedByUser;
    const isWebAuthFlowHasError = webAuthFlowState === WebAuthState.Failed || isWebAuthFailedByUser;

    useEffect(() => {
        const getData = async (): Promise<void> => {
            const {
                policyAgreement,
                helpUsImprove,
                webAuthFlowState,
                forwarderDomain,
            } = await messenger.getConsentData();

            setPolicyAgreement(policyAgreement);
            setHelpUsImprove(helpUsImprove);
            setWebAuthFlowState(webAuthFlowState);

            const {
                eulaUrl,
                privacyUrl,
            } = getPrivacyAndEulaUrls(forwarderDomain);

            const supportUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.POPUP_DEFAULT_SUPPORT);

            setEulaUrl(eulaUrl);
            setPrivacyUrl(privacyUrl);
            setSupportUrl(supportUrl);
        };

        getData();
    }, []);

    const messageHandler = (message: NotifierMessage): void => {
        const { type, data, value } = message;

        switch (type) {
            case notifier.types.AUTH_CACHE_UPDATED:
                switch (data) {
                    case AuthCacheKey.PolicyAgreement:
                        setPolicyAgreement(value);
                        break;
                    case AuthCacheKey.HelpUsImprove:
                        setHelpUsImprove(value);
                        break;
                    case AuthCacheKey.WebAuthFlowState:
                        setWebAuthFlowState(value);
                        break;
                    default:
                        break;
                }
                break;
            // Close consent page when user authenticates
            case notifier.types.USER_AUTHENTICATED:
                window.close();
                break;
            default:
                break;
        }
    };

    useSubscribeNotifier(NOTIFIER_EVENTS, messageHandler);

    const stopPropagation = async (e: React.MouseEvent): Promise<void> => {
        e.stopPropagation();
    };

    const handlePolicyToggle = async (): Promise<void> => {
        const newValue = !policyAgreement;
        await messenger.updateAuthCache(AuthCacheKey.PolicyAgreement, newValue);
        setPolicyAgreement(newValue);
    };

    const handleHelpUsImproveToggle = async (): Promise<void> => {
        const newValue = !helpUsImprove;
        await messenger.updateAuthCache(AuthCacheKey.HelpUsImprove, newValue);
        setHelpUsImprove(newValue);
    };

    const openUsageDataModal = (e: React.MouseEvent<HTMLAnchorElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        setIsUsageDataModalOpen(true);
    };

    const closeUsageDataModal = (): void => {
        setIsUsageDataModalOpen(false);
    };

    const closeFailedToLoginModal = async (): Promise<void> => {
        await messenger.sendWebAuthAction(WebAuthAction.DismissFailure);
    };

    const handleContinueClick = async (): Promise<void> => {
        // save the consent data
        await messenger.setConsentData(policyAgreement, helpUsImprove);

        // start the web authentication flow
        await messenger.sendWebAuthAction(WebAuthAction.Start);
    };

    const handleReopenClick = async (): Promise<void> => {
        await messenger.sendWebAuthAction(WebAuthAction.Reopen);
    };

    const handleCancelClick = async (): Promise<void> => {
        await messenger.sendWebAuthAction(WebAuthAction.Cancel);
    };

    if (isWebAuthFlowStarted) {
        return (
            <div className="consent">
                <div className="consent__loader-content">
                    {isWebAuthFlowLoading && (
                        <Icon
                            name="spinner"
                            color="product"
                            size="48"
                            className="consent__loader-spinner"
                        />
                    )}
                    <h2 className="consent__loader-title">
                        {translator.getMessage('auth_loading_title')}
                    </h2>
                    <p className="consent__loader-description">
                        {translator.getMessage('auth_loading_description')}
                    </p>
                </div>
                <div className="consent__loader-actions">
                    <Button className="consent__loader-button" onClick={handleReopenClick}>
                        {translator.getMessage('auth_loading_button_reopen')}
                    </Button>
                    <Button className="consent__loader-button" variant="transparent" onClick={handleCancelClick}>
                        {translator.getMessage('auth_loading_button_cancel')}
                    </Button>
                </div>
                <FailedToLoginModal
                    isOpen={isWebAuthFlowHasError}
                    supportUrl={supportUrl}
                    shouldShowSupportLink={!isWebAuthFailedByUser}
                    onClose={closeFailedToLoginModal}
                />
                <Icons />
            </div>
        );
    }

    return (
        <div className="consent">
            <div className="consent__header">
                <div className="consent__logo" />
            </div>
            <div className="consent__content">
                <div className="consent__image-wrapper">
                    <img
                        src={vpnBlockedErrorNinjaImageUrl}
                        alt="Reading Ninja"
                        className="consent__image"
                    />
                </div>
                <div className="consent__title">
                    {translator.getMessage('popup_auth_policy_agreement_title')}
                </div>
                <div className="consent__checkboxes">
                    <Checkbox
                        id="policy_agreement"
                        label={reactTranslator.getMessage('popup_auth_policy_agreement', {
                            eula: (chunks: string) => (
                                <a
                                    href={eulaUrl}
                                    className="link"
                                    target="_blank"
                                    rel="noreferrer"
                                    // handler used to stop propagation,
                                    // because it's contained in a checkbox label
                                    // in order to avoid checking the checkbox
                                    // when clicking on the link
                                    onClick={stopPropagation}
                                >
                                    {chunks}
                                </a>
                            ),
                            privacy: (chunks: string) => (
                                <a
                                    href={privacyUrl}
                                    className="link"
                                    target="_blank"
                                    rel="noreferrer"
                                    // handler used to stop propagation,
                                    // because it's contained in a checkbox label
                                    // in order to avoid checking the checkbox
                                    // when clicking on the link
                                    onClick={stopPropagation}
                                >
                                    {chunks}
                                </a>
                            ),
                        })}
                        value={policyAgreement}
                        onToggle={handlePolicyToggle}
                    />
                    <Checkbox
                        id="help_us_improve"
                        label={reactTranslator.getMessage('popup_auth_help_us_improve_agreement', {
                            link: (chunks: string) => (
                                <a
                                    role="button"
                                    href="#"
                                    onClick={openUsageDataModal}
                                    className="link"
                                >
                                    {chunks}
                                </a>
                            ),
                        })}
                        value={helpUsImprove}
                        onToggle={handleHelpUsImproveToggle}
                    />
                </div>
                <div className="consent__actions-spacer" />
                <div className="consent__actions">
                    <Button onClick={handleContinueClick} disabled={!policyAgreement}>
                        {translator.getMessage('popup_auth_policy_agreement_continue_button')}
                    </Button>
                </div>
            </div>
            <UsageDataModal
                isOpen={isUsageDataModalOpen}
                privacyUrl={privacyUrl}
                onClose={closeUsageDataModal}
            />
            <FailedToLoginModal
                isOpen={isWebAuthFlowHasError}
                supportUrl={supportUrl}
                shouldShowSupportLink={!isWebAuthFailedByUser}
                onClose={closeFailedToLoginModal}
            />
            <Icons />
        </div>
    );
}
