import React, {
    useContext,
    useEffect,
    useState,
    type FormEvent,
} from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { isIP } from 'is-ip';
import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { getForwarderUrl } from '../../../../common/helpers';
import { reactTranslator } from '../../../../common/reactTranslator';
import { translator } from '../../../../common/translator';
import { FORWARDER_URL_QUERIES } from '../../../../background/config';

const DOH_PREFIX = 'https://';
const DOT_PREFIX = 'tls://';

enum ModalType {
    AddDnsServer = 'addDnsServer',
    EditDnsServer = 'editDnsServer',
}

const DNS_SERVER_ERROR = {
    INVALID: translator.getMessage('settings_dns_add_custom_server_invalid_address'),
    DUPLICATE: translator.getMessage('settings_dns_add_custom_server_duplicate_address'),
};

export const CustomDnsServerModal = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

    const {
        forwarderDomain,
        dnsServerName,
        dnsServerAddress,
        setDnsServerName,
        setDnsServerAddress,
    } = settingsStore;

    const adguardDnsKbUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.ADGUARD_DNS_KB);

    const [dnsServerAddressError, setDnsServerAddressError] = useState<string | null>(null);

    const handleAddressChange = (value: string) => {
        setDnsServerAddress(value);
        if (dnsServerAddressError) {
            setDnsServerAddressError(null);
        }
    };

    const clearDnsServerAddress = () => {
        setDnsServerAddress('');
        setDnsServerAddressError(null);
    };

    const clearInputs = (): void => {
        setDnsServerName('');
        setDnsServerAddress('');
    };

    const closeModal = (): void => {
        clearInputs();
        if (settingsStore.dnsServerToEdit) {
            settingsStore.setDnsServerToEdit(null);
        }
        setDnsServerAddressError(null);
        settingsStore.closeCustomDnsModal();
    };

    const validateDnsAddress = (address: string): string | null => {
        // check existing custom dns addresses

        if (settingsStore.customDnsServers.some((server) => server.address === address)) {
            return DNS_SERVER_ERROR.DUPLICATE;
        }
        // for the moment only plain dns and tls supported
        if (address.startsWith(DOH_PREFIX) || !address.includes('.')) {
            return DNS_SERVER_ERROR.INVALID;
        }
        return null;
    };

    const handleDnsAddress = (address: string) => {
        if (isIP(address) || address.startsWith(DOT_PREFIX)) {
            return address;
        }
        return `${DOT_PREFIX}${address}`;
    };

    const addDnsServer = async (): Promise<void> => {
        const dnsServerAddressError = validateDnsAddress(dnsServerAddress);
        if (dnsServerAddressError) {
            setDnsServerAddressError(dnsServerAddressError);
            return;
        }
        const dnsAddressToAdd = handleDnsAddress(dnsServerAddress);
        const dnsServer = await settingsStore.addCustomDnsServer(dnsServerName, dnsAddressToAdd);
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
        if (!settingsStore.dnsServerToEdit) {
            return;
        }
        const { address } = settingsStore.dnsServerToEdit;

        // `address` is dns address before editing,
        // `dnsServerAddress` is the state of dns address form.
        // if dns address was edited, it has to be verified.
        if (address !== dnsServerAddress) {
            const dnsServerAddressError = validateDnsAddress(dnsServerAddress);
            if (dnsServerAddressError) {
                setDnsServerAddressError(dnsServerAddressError);
                return;
            }
        }
        const editedDnsAddress = handleDnsAddress(dnsServerAddress);
        await settingsStore.editCustomDnsServer(dnsServerName, editedDnsAddress);
        closeModal();
    };

    const modalType = settingsStore.dnsServerToEdit
        ? ModalType.EditDnsServer
        : ModalType.AddDnsServer;

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
            const { title: serverName, address } = settingsStore.dnsServerToEdit;

            setDnsServerName(serverName);
            setDnsServerAddress(address);
        }
    }, [settingsStore.isCustomDnsModalOpen]);

    const ipAddressInputClasses = classnames(
        'input__in',
        'input__in--content',
        'input__in--clear',
        { 'dns-settings__modal--input--error': dnsServerAddressError },
    );

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        modalData[modalType].handler();
    };

    return (
        <Modal
            isOpen={settingsStore.isCustomDnsModalOpen}
            className="modal dns-settings__modal"
            overlayClassName="overlay overlay--fullscreen"
            onRequestClose={closeModal}
        >
            <form onSubmit={handleSubmit}>
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
                                    a: (chunks: string) => {
                                        return (
                                            <a
                                                href={adguardDnsKbUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="dns-settings__modal--link"
                                            >
                                                {chunks}
                                            </a>
                                        );
                                    },
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
                                required
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
                                required
                            />
                            {dnsServerAddressError && (
                                <div className="dns-settings__modal--error-message">
                                    {dnsServerAddressError}
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
                </div>
            </form>
        </Modal>
    );
});
