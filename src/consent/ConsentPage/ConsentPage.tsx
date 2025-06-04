/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect, useState } from 'react';

import { messenger } from '../../common/messenger';
import { translator } from '../../common/translator';
import { reactTranslator } from '../../common/reactTranslator';
import { getPrivacyAndEulaUrls } from '../../common/forwarderHelpers';
import { Icons } from '../../common/components/Icons';
import { Checkbox } from '../../options/components/ui/Checkbox';
import { Button } from '../../options/components/ui/Button';
import { Modal } from '../../options/components/ui/Modal';
import vpnBlockedErrorNinjaImageUrl from '../../assets/images/vpn-blocked-error-ninja.svg';

import '../../options/styles/main.pcss';
import './consent-page.pcss';

export function ConsentPage() {
    // Retrieved from background
    const [policyAgreement, setPolicyAgreement] = useState(false);
    const [helpUsImprove, setHelpUsImprove] = useState(false);
    const [forwarderDomain, setForwarderDomain] = useState<string | null>(null);

    // Local state
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);

    useEffect(() => {
        const getData = async () => {
            const { policyAgreement, helpUsImprove, forwarderDomain } = await messenger.getConsentData();
            setPolicyAgreement(policyAgreement);
            setHelpUsImprove(helpUsImprove);
            setForwarderDomain(forwarderDomain);
            setIsDataLoaded(true);
        };

        getData();
    }, []);

    if (!isDataLoaded || !forwarderDomain) {
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

    const handlePolicyToggle = (): void => {
        setPolicyAgreement((old) => !old);
    };

    const handleHelpUsImproveToggle = (): void => {
        setHelpUsImprove((old) => !old);
    };

    const openAgreementModal = (e: React.MouseEvent<HTMLAnchorElement>): void => {
        e.preventDefault();
        setIsAgreementModalOpen(true);
    };

    const closeAgreementModal = (): void => {
        setIsAgreementModalOpen(false);
    };

    const handleContinueClick = async (): Promise<void> => {
        // save the consent data
        await messenger.setConsentData(policyAgreement, helpUsImprove);

        // skip consent step and pre-activate Screenshot Flow
        // in the popup when it is opened later
        await messenger.updateAuthCache('step', 'screenshot');
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
                                    onClick={openAgreementModal}
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
                <Button onClick={handleContinueClick} disabled={!policyAgreement}>
                    {translator.getMessage('popup_auth_policy_agreement_page_continue_button')}
                </Button>
            </div>
            <Modal
                title={translator.getMessage('settings_help_us_improve_modal_title')}
                description={(
                    <>
                        <p className="consent__modal-text">
                            {translator.getMessage('settings_help_us_improve_modal_desc_data')}
                        </p>
                        <ul className="consent__modal-list">
                            <li className="consent__modal-list-item">
                                {translator.getMessage('settings_help_us_improve_modal_desc_data_screens')}
                            </li>
                            <li className="consent__modal-list-item">
                                {translator.getMessage('settings_help_us_improve_modal_desc_data_buttons')}
                            </li>
                            <li className="consent__modal-list-item">
                                {translator.getMessage('settings_help_us_improve_modal_desc_data_sessions')}
                            </li>
                        </ul>
                        <p className="consent__modal-text">
                            {translator.getMessage('settings_help_us_improve_modal_desc_improve')}
                        </p>
                        <p className="consent__modal-text">
                            {translator.getMessage('settings_help_us_improve_modal_desc_internally')}
                        </p>
                        <a
                            href={privacyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link consent__modal-link"
                        >
                            {translator.getMessage('privacy_policy')}
                        </a>
                    </>
                )}
                actions={(
                    <Button onClick={closeAgreementModal}>
                        {translator.getMessage('settings_help_us_improve_modal_button')}
                    </Button>
                )}
                isOpen={isAgreementModalOpen}
                className="consent__modal"
                onClose={closeAgreementModal}
            />
            <Icons />
        </div>
    );
}
