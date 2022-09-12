import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import { isIP } from 'is-ip';
import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';

export const CustomDnsServerModal = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

    const [dnsServerName, setDnsServerName] = useState('');
    const [dnsServerAddress, setDnsServerAddress] = useState('');
    const [ipAddressError, setIpAddressError] = useState(false);

    const handleAddressChange = (value: string) => {
        setDnsServerAddress(value);
        if (ipAddressError) {
            setIpAddressError(false);
        }
    };

    const dnsInfo = reactTranslator.getMessage('settings_dns_add_custom_server_info', {
        // FIXME check link address and add to tds
        a: (chunks: string) => (`<a href="https://adguard-dns.io/kb/general/dns-providers/" target="_blank" class="dns-settings__modal--link">${chunks}</a>`),
    });

    const clearInputs = (): void => {
        setDnsServerName('');
        setDnsServerAddress('');
    };

    const closeModal = (): void => {
        clearInputs();
        if (settingsStore.dnsServerToEdit) {
            settingsStore.setDnsServerToEdit(null);
        }
        setIpAddressError(false);
        settingsStore.closeCustomDnsModalOpen();
    };

    const isValidIpAddress = (ip: string) => isIP(ip);

    const addDnsServer = async (): Promise<void> => {
        if (!isValidIpAddress(dnsServerAddress)) {
            setIpAddressError(true);
            return;
        }
        const dnsServer = await settingsStore.addCustomDnsServer(dnsServerName, dnsServerAddress);
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
        if (!isValidIpAddress(dnsServerAddress)) {
            setIpAddressError(true);
            return;
        }
        await settingsStore.editCustomDnsServer(dnsServerName, dnsServerAddress);
        closeModal();
    };

    const modalType = settingsStore.dnsServerToEdit ? 'editDnsServer' : 'addDnsServer';

    const modalData = {
        addDnsServer: {
            modalTitle: reactTranslator.getMessage('settings_dns_add_custom_server'),
            submitText: reactTranslator.getMessage('settings_dns_add_custom_server_save_and_select'),
            handler: addDnsServer,
        },
        editDnsServer: {
            modalTitle: reactTranslator.getMessage('settings_dns_edit_custom_server'),
            submitText: reactTranslator.getMessage('settings_dns_add_custom_server_save'),
            handler: editDnsServer,
        },
    };

    useEffect(() => {
        if (settingsStore.dnsServerToEdit) {
            const { title: serverName } = settingsStore.dnsServerToEdit;
            const { ip1: serverIp } = settingsStore.dnsServerToEdit;

            setDnsServerName(serverName);
            setDnsServerAddress(serverIp);
        }
    }, [settingsStore.isCustomDnsModalOpen]);

    const ipAddressInputClasses = classnames(
        'input__in',
        'input__in--content',
        'input__in--clear',
        { 'dns-settings__modal--input--error': ipAddressError },
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
                <form
                    onSubmit={modalData[modalType].handler}
                >
                    {!settingsStore.dnsServerToEdit && (
                        <div className="form__item">
                            <div dangerouslySetInnerHTML={{ __html: dnsInfo as string }} />
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
                                placeholder={reactTranslator.getMessage('settings_dns_add_custom_server_name_placeholder') as string}
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
                                placeholder={reactTranslator.getMessage('settings_dns_add_custom_server_address_placeholder') as string}
                            />
                            {ipAddressError && (
                                <div className="dns-settings__modal--error-message">
                                    {reactTranslator.getMessage('settings_dns_add_custom_server_invalid_address')}
                                </div>
                            )}
                            {dnsServerAddress && (
                                <button
                                    type="button"
                                    className="button dns-settings__modal--clear-icon"
                                    onClick={() => setDnsServerAddress('')}
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
                            type="submit"
                            className="button button--medium button--primary"
                            disabled={!(dnsServerName && dnsServerAddress)}
                        >
                            {modalData[modalType].submitText}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
});
