import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import { isIP } from 'is-ip';
import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { FORWARDER_DOMAIN } from '../../../../background/config';

const ADGUARD_DNS_KB_LINK = `https://${FORWARDER_DOMAIN}/forward.html?action=adguard_dns_kb&from=options_screen&app=vpn_extension`;

const DOH_PREFIX = 'https://';
const DOT_PREFIX = 'tls://';

export const CustomDnsServerModal = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

    const [dnsServerName, setDnsServerName] = useState('');
    const [dnsServerAddress, setDnsServerAddress] = useState('');
    const [dnsServerAddressError, setDnsServerAddressError] = useState(false);

    const handleAddressChange = (value: string) => {
        setDnsServerAddress(value);
        if (dnsServerAddressError) {
            setDnsServerAddressError(false);
        }
    };

    const dnsInfo = reactTranslator.getMessage('settings_dns_add_custom_server_info', {
        a: (chunks: string) => (`<a href="${ADGUARD_DNS_KB_LINK}" target="_blank" class="dns-settings__modal--link">${chunks}</a>`),
    });

    const clearDnsServerAddress = () => {
        setDnsServerAddress('');
        setDnsServerAddressError(false);
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
        setDnsServerAddressError(false);
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
            setDnsServerAddressError(true);
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
            setDnsServerAddressError(true);
            return;
        }
        await settingsStore.editCustomDnsServer(dnsServerName, validDnsAddress);
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
        { 'dns-settings__modal--input--error': dnsServerAddressError },
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
                            {dnsServerAddressError && (
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
