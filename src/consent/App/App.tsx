/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect, useState } from 'react';

import { AuthCacheKey } from '../../background/authentication/authCacheTypes';
import { type NotifierMessage, messenger } from '../../common/messenger';
import { translator } from '../../common/translator';
import { reactTranslator } from '../../common/reactTranslator';
import { getPrivacyAndEulaUrls } from '../../common/forwarderHelpers';
import { Icons } from '../../common/components/Icons';
import { notifier } from '../../common/notifier';
import { useSubscribeNotifier } from '../../common/hooks/useSubscribeNotifier';
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
export function App() {
    // Retrieved from background
    const [policyAgreement, setPolicyAgreement] = useState(false);
    const [helpUsImprove, setHelpUsImprove] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [eulaUrl, setEulaUrl] = useState<string | undefined>(undefined);
    const [privacyUrl, setPrivacyUrl] = useState<string | undefined>(undefined);

    // Local state
    const [isUsageDataModalOpen, setIsUsageDataModalOpen] = useState(false);
    const [isFailedToLoginModalOpen, setIsFailedToLoginModalOpen] = useState(false);

    useEffect(() => {
        const getData = async () => {
            const {
                policyAgreement,
                helpUsImprove,
                marketingConsent,
                isWebAuthFlowHasError,
                forwarderDomain,
            } = await messenger.getConsentData();

            setPolicyAgreement(policyAgreement);
            setHelpUsImprove(helpUsImprove);
            setMarketingConsent(marketingConsent);
            setIsFailedToLoginModalOpen(isWebAuthFlowHasError);

            const {
                eulaUrl,
                privacyUrl,
            } = getPrivacyAndEulaUrls(forwarderDomain);

            setEulaUrl(eulaUrl);
            setPrivacyUrl(privacyUrl);
        };

        getData();
    }, []);

    const messageHandler = (message: NotifierMessage) => {
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
                    case AuthCacheKey.MarketingConsent:
                        setMarketingConsent(value);
                        break;
                    case AuthCacheKey.IsWebAuthFlowHasError:
                        setIsFailedToLoginModalOpen(value);
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
        await messenger.updateAuthCache(AuthCacheKey.IsWebAuthFlowHasError, false);
    };

    const handleContinueClick = async (): Promise<void> => {
        // save the consent data
        await messenger.setConsentData(policyAgreement, helpUsImprove);

        // start the web authentication flow
        await messenger.startWebAuthFlow(marketingConsent);
    };

    return (
        <div className="consent">
            <div className="consent__header">
                <div className="consent__logo" />
            </div>
            <div className="consent__content">
                <img
                    src={vpnBlockedErrorNinjaImageUrl}
                    alt="Reading Ninja"
                    className="consent__image"
                />
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
                        // cast value to boolean, because it might be `null` from background
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
                        // cast value to boolean, because it might be `null` from background
                        value={helpUsImprove}
                        onToggle={handleHelpUsImproveToggle}
                    />
                </div>
                <Button onClick={handleContinueClick} disabled={!policyAgreement}>
                    {translator.getMessage('popup_auth_policy_agreement_continue_button')}
                </Button>
            </div>
            <UsageDataModal
                isOpen={isUsageDataModalOpen}
                privacyUrl={privacyUrl}
                onClose={closeUsageDataModal}
            />
            <FailedToLoginModal
                isOpen={isFailedToLoginModalOpen}
                onClose={closeFailedToLoginModal}
            />
            <Icons />
        </div>
    );
}
