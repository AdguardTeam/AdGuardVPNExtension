import React, { useContext, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';

interface CustomDnsServerModalProps {
    isOpen: boolean,
    closeModal: () => void,
    modalType: string,
    dnsServerData?: {
        id: string,
        ip: string,
        title: string,
    },
}

export const CustomDnsServerModal = observer(({
    isOpen,
    closeModal,
    modalType,
    dnsServerData,
}: CustomDnsServerModalProps) => {
    const { settingsStore } = useContext(rootStore);

    const dnsInfo = reactTranslator.getMessage('settings_dns_add_custom_server_info', {
        // FIXME check link address and add to tds
        a: (chunks) => (`<a href="https://adguard-dns.io/kb/general/dns-providers/" target="_blank" class="dns-settings__modal__link">${chunks}</a>`),
    });

    const [dnsServerName, setDnsServerName] = useState(modalData[modalType].name);
    const [dnsServerAddress, setDnsServerAddress] = useState(modalData[modalType].ip);

    const addDnsServer = async () => {
        await settingsStore.addCustomDnsServer(dnsServerName, dnsServerAddress);
        closeModal();
    };

    const modalData = {
        add: {
            title: reactTranslator.getMessage('settings_dns_add_custom_server'),
            info: (
                <div className="form__item dns-settings__modal__info">
                    <div dangerouslySetInnerHTML={{ __html: dnsInfo as string }} />
                </div>
            ),
            name: '',
            ip: '',
            handler: addDnsServer,
        },
        edit: {
            title: reactTranslator.getMessage('settings_dns_edit_custom_server'),
            info: '',
            name: dnsServerData?.title,
            ip: dnsServerData?.ip,
        },
    };

    // @ts-ignore
    const modalTitle = modalData[modalType].title;
    const modalInfo = modalData[modalType].info;

    return (
        <Modal
            isOpen={isOpen}
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
            <div className="modal__title dns-settings__modal__title">{modalTitle}</div>
            <div className="dns-settings__modal__content">
                <form
                    onSubmit={addDnsServer}
                >
                    {modalInfo}
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
                                placeholder="Name"
                            />
                        </label>
                    </div>
                    <div className="form__item">
                        <label>
                            <div className="input__label">
                                {reactTranslator.getMessage('settings_dns_add_custom_server_address')}
                            </div>
                            <input
                                id="dns-address"
                                className="input__in input__in--content input__in--clear"
                                type="text"
                                value={dnsServerAddress}
                                onChange={(e) => setDnsServerAddress(e.target.value)}
                                placeholder="IPv4 or IPv6"
                            />
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
                            {reactTranslator.getMessage('settings_dns_add_custom_server_save')}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
});
