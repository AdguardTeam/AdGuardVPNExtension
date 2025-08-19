/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect, useState } from 'react';

import { messenger } from '../../common/messenger';
import { translator } from '../../common/translator';
import { reactTranslator } from '../../common/reactTranslator';
import { getPrivacyAndEulaUrls } from '../../common/forwarderHelpers';
import { Icons } from '../../common/components/Icons';
import { Checkbox } from '../../options/components/ui/Checkbox';
import { Button } from '../../options/components/ui/Button';
import vpnBlockedErrorNinjaImageUrl from '../../assets/images/vpn-blocked-error-ninja.svg';

import { UsageDataModal } from './UsageDataModal';
import { FailedToLoginModal } from './FailedToLoginModal';

import '../../options/styles/main.pcss';
import './app.pcss';

export function App() {
    // Retrieved from background
    const [cachedPolicyAgreement, setCachedPolicyAgreement] = useState(false);
    const [policyAgreement, setPolicyAgreement] = useState(false);
    const [cachedHelpUsImprove, setCachedHelpUsImprove] = useState(false);
    const [forwarderDomain, setForwarderDomain] = useState<string | null>(null);

    // Local state
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isUsageDataModalOpen, setIsUsageDataModalOpen] = useState(false);
    const [isFailedToLoginModalOpen, setIsFailedToLoginModalOpen] = useState(false);

    useEffect(() => {
        const getData = async () => {
            const {
                cachedPolicyAgreement,
                policyAgreement,
                cachedHelpUsImprove,
                forwarderDomain,
            } = await messenger.getConsentData();

            setCachedPolicyAgreement(cachedPolicyAgreement);
            setPolicyAgreement(policyAgreement);
            setCachedHelpUsImprove(cachedHelpUsImprove);
            setForwarderDomain(forwarderDomain);
            setIsDataLoaded(true);
        };

        getData();
    }, []);

    // FIXME: Should we show loader in case if data is not loaded yet?
    if (!isDataLoaded || !forwarderDomain) {
        return null;
    }

    // FIXME: Maybe we should show something if user already accepted consent?
    if (policyAgreement) {
        return null;
    }

    const { eulaUrl, privacyUrl } = getPrivacyAndEulaUrls(forwarderDomain);

    const handlePrivacyClick = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
        e.preventDefault();
        e.stopPropagation();
        await messenger.openTab(privacyUrl);
    };

    const handleEulaClick = async (e: React.MouseEvent<HTMLAnchorElement>): Promise<void> => {
        e.preventDefault();
        e.stopPropagation();
        await messenger.openTab(eulaUrl);
    };

    const handlePolicyToggle = async (): Promise<void> => {
        const newValue = !cachedPolicyAgreement;
        await messenger.updateAuthCache('policyAgreement', newValue);
        setCachedPolicyAgreement(newValue);
    };

    const handleHelpUsImproveToggle = async (): Promise<void> => {
        const newValue = !cachedHelpUsImprove;
        await messenger.updateAuthCache('helpUsImprove', newValue);
        setCachedHelpUsImprove(newValue);
    };

    const openUsageDataModal = (e: React.MouseEvent<HTMLAnchorElement>): void => {
        e.preventDefault();
        setIsUsageDataModalOpen(true);
    };

    const closeUsageDataModal = (): void => {
        setIsUsageDataModalOpen(false);
    };

    const closeFailedToLoginModal = (): void => {
        setIsFailedToLoginModalOpen(false);
    };

    const handleContinueClick = async (): Promise<void> => {
        // save the consent data
        await messenger.setConsentData(cachedPolicyAgreement, cachedHelpUsImprove);
        setPolicyAgreement(cachedPolicyAgreement);

        // FIXME: Initiate WebAuth
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
                                    // handler used to prevent default action,
                                    // because it's contained in a checkbox label
                                    // in order to avoid checking the checkbox
                                    // when clicking on the link
                                    onClick={handleEulaClick}
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
                                    // handler used to prevent default action,
                                    // because it's contained in a checkbox label
                                    // in order to avoid checking the checkbox
                                    // when clicking on the link
                                    onClick={handlePrivacyClick}
                                >
                                    {chunks}
                                </a>
                            ),
                        })}
                        // cast value to boolean, because it might be `null` from background
                        value={!!cachedPolicyAgreement}
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
                        value={!!cachedHelpUsImprove}
                        onToggle={handleHelpUsImproveToggle}
                    />
                </div>
                <Button onClick={handleContinueClick} disabled={!cachedPolicyAgreement}>
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
