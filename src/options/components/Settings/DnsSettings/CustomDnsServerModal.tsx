import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import { isIP } from 'is-ip';
import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { translator } from '../../../../common/translator';
import { ADGUARD_DNS_KB_LINK } from '../../../../background/config';

const DOH_PREFIX = 'https://';
const DOT_PREFIX = 'tls://';

enum ModalType {
    AddDnsServer = 'addDnsServer',
    EditDnsServer = 'editDnsServer',
}

export const CustomDnsServerModal = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

    const [dnsServerName, setDnsServerName] = useState('');
    const [dnsServerAddress, setDnsServerAddress] = useState('');
    const [isDnsServerAddressError, setIsDnsServerAddressError] = useState(false);

    const handleAddressChange = (value: string) => {
        setDnsServerAddress(value);
        if (isDnsServerAddressError) {
            setIsDnsServerAddressError(false);
        }
    };

    const clearDnsServerAddress = () => {
        setDnsServerAddress('');
        setIsDnsServerAddressError(false);
    };

    const clearInputs = (): void => {
        setDnsServerName('');
        clearDnsServerAddress();
    };

    const closeModal = (): void => {
        clearInputs();
        if (settingsStore.dnsServerToEdit) {
            settingsStore.setDnsServerToEdit(null);
        }
        setIsDnsServerAddressError(false);
        settingsStore.closeCustomDnsModalOpen();
    };

    const handleDnsAddress = (address: string) => {
        if (isIP(address) || address.startsWith(DOT_PREFIX)) {
            return address;
        }
        if (!address.startsWith(DOH_PREFIX) && address.includes('.')) {
            return `${DOT_PREFIX}${address}`;
        }
        return null;
    };

    const addDnsServer = async (): Promise<void> => {
        const validDnsAddress = handleDnsAddress(dnsServerAddress);
        if (!validDnsAddress) {
            setIsDnsServerAddressError(true);
            return;
        }
        const dnsServer = await settingsStore.addCustomDnsServer(dnsServerName, validDnsAddress);
        notificationsStore.notifySuccess(
            reactTranslator.getMessage('settings_dns_add_custom_server_notification_success'),
            {
                action: reactTranslator.getMessage('settings_exclusions_undo'),
                handler: () => settingsStore.removeCustomDnsServer(dnsServer.id),
            },
        );
        closeModal();
    };

    const editDnsServer = async (): Promise<void> => {
        const validDnsAddress = handleDnsAddress(dnsServerAddress);
        if (!validDnsAddress) {
            setIsDnsServerAddressError(true);
            return;
        }
        await settingsStore.editCustomDnsServer(dnsServerName, validDnsAddress);
        closeModal();
    };

    const modalType = settingsStore.dnsServerToEdit ? ModalType.EditDnsServer : ModalType.AddDnsServer;

    const modalData = {
        [ModalType.AddDnsServer]: {
            modalTitle: reactTranslator.getMessage('settings_dns_add_custom_server'),
            submitText: reactTranslator.getMessage('settings_dns_add_custom_server_save_and_select'),
            handler: addDnsServer,
        },
        [ModalType.EditDnsServer]: {
            modalTitle: reactTranslator.getMessage('settings_dns_edit_custom_server'),
            submitText: reactTranslator.getMessage('settings_dns_add_custom_server_save'),
            handler: editDnsServer,
        },
    };

    useEffect(() => {
        if (settingsStore.dnsServerToEdit) {
            const { title: serverName } = settingsStore.dnsServerToEdit;
            const { address: serverAddress } = settingsStore.dnsServerToEdit;

            setDnsServerName(serverName);
            setDnsServerAddress(serverAddress);
        }
    }, [settingsStore.isCustomDnsModalOpen]);

    const ipAddressInputClasses = classnames(
        'input__in',
        'input__in--content',
        'input__in--clear',
        { 'dns-settings__modal--input--error': isDnsServerAddressError },
    );

    return (
        <Modal
            isOpen={settingsStore.isCustomDnsModalOpen}
            className="modal dns-settings__modal"
            overlayClassName="overlay overlay--fullscreen"
            onRequestClose={closeModal}
        >
            <button
                type="button"
                className="button button--icon checkbox__button modal__close-icon"
                onClick={closeModal}
            >
                <svg className="icon icon--button icon--cross">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
            <div className="dns-settings__modal--title">{modalData[modalType].modalTitle}</div>
            <div className="dns-settings__modal--content">
                {!settingsStore.dnsServerToEdit && (
                    <div className="form__item">
                        {
                            reactTranslator.getMessage('settings_dns_add_custom_server_info', {
                                a: (chunks: string) => (<a href={ADGUARD_DNS_KB_LINK} target="_blank" className="dns-settings__modal--link">{chunks}</a>),
                            })
                        }
                    </div>
                )}
                <div className="form__item">
                    <label>
                        <div className="input__label">
                            {reactTranslator.getMessage('settings_dns_add_custom_server_name')}
                        </div>
                        <input
                            id="dns-name"
                            className="input__in input__in--content input__in--clear"
                            type="text"
                            value={dnsServerName}
                            onChange={(e) => setDnsServerName(e.target.value)}
                            placeholder={translator.getMessage('settings_dns_add_custom_server_name_placeholder')}
                        />
                        {dnsServerName && (
                            <button
                                type="button"
                                className="button dns-settings__modal--clear-icon"
                                onClick={() => setDnsServerName('')}
                            >
                                <svg className="icon icon--button icon--cross">
                                    <use xlinkHref="#cross" />
                                </svg>
                            </button>
                        )}
                    </label>
                </div>
                <div className="form__item">
                    <label>
                        <div className="input__label">
                            {reactTranslator.getMessage('settings_dns_add_custom_server_address')}
                        </div>
                        <input
                            id="dns-address"
                            className={ipAddressInputClasses}
                            type="text"
                            value={dnsServerAddress}
                            onChange={(e) => handleAddressChange(e.target.value)}
                            placeholder={translator.getMessage('settings_dns_add_custom_server_address_placeholder')}
                        />
                        {isDnsServerAddressError && (
                            <div className="dns-settings__modal--error-message">
                                {reactTranslator.getMessage('settings_dns_add_custom_server_invalid_address')}
                            </div>
                        )}
                        {dnsServerAddress && (
                            <button
                                type="button"
                                className="button dns-settings__modal--clear-icon"
                                onClick={clearDnsServerAddress}
                            >
                                <svg className="icon icon--button icon--cross">
                                    <use xlinkHref="#cross" />
                                </svg>
                            </button>
                        )}
                    </label>
                </div>
                <div className="form__actions">
                    <button
                        type="button"
                        className="button button--medium button--outline-secondary"
                        onClick={closeModal}
                    >
                        {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                    </button>
                    <button
                        type="button"
                        className="button button--medium button--primary"
                        disabled={!(dnsServerName && dnsServerAddress)}
                        onClick={modalData[modalType].handler}
                    >
                        {modalData[modalType].submitText}
                    </button>
                </div>
            </div>
        </Modal>
    );
});
