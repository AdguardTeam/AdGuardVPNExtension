import React, { useContext, useId, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';

export interface DnsSettingsServerModalProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    submitBtnTitle?: React.ReactNode;
    isOpen: boolean;
    onSubmit: (dnsServerName: string, dnsServerAddress: string) => Promise<string | null>;
}

export const DnsSettingsServerModal = observer(({
    title,
    description,
    submitBtnTitle,
    isOpen,
    onSubmit,
}: DnsSettingsServerModalProps) => {
    const { settingsStore } = useContext(rootStore);

    const {
        dnsServerName,
        dnsServerAddress,
    } = settingsStore;

    const formId = useId();

    const [dnsServerAddressError, setDnsServerAddressError] = useState<string | null>(null);

    const handleCloseModal = () => {
        settingsStore.closeCustomDnsModal();
        settingsStore.setDnsServerName('');
        settingsStore.setDnsServerAddress('');
        settingsStore.setDnsServerToEdit(null);
        setDnsServerAddressError(null);
    };

    const handleDnsServerNameChange = (value: string) => {
        settingsStore.setDnsServerName(value);
    };

    const handleDnsServerAddressChange = (value: string) => {
        settingsStore.setDnsServerAddress(value);
        if (dnsServerAddressError) {
            setDnsServerAddressError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const dnsServerAddressError = await onSubmit(dnsServerName, dnsServerAddress);
        if (dnsServerAddressError) {
            setDnsServerAddressError(dnsServerAddressError);
            return;
        }
        handleCloseModal();
    };

    const handleReset = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleCloseModal();
    };

    return (
        <Modal
            title={title}
            description={description}
            isOpen={isOpen}
            actions={(
                <>
                    <Button type="submit" form={formId}>
                        {submitBtnTitle}
                    </Button>
                    <Button variant="outlined" type="reset" form={formId}>
                        {translator.getMessage('settings_exclusion_modal_cancel')}
                    </Button>
                </>
            )}
            onClose={handleCloseModal}
        >
            <form
                id={formId}
                className="modal__form"
                onSubmit={handleSubmit}
                onReset={handleReset}
            >
                <Input
                    id="dns-name"
                    name="dns-name"
                    label={translator.getMessage('settings_dns_add_custom_server_name')}
                    placeholder={translator.getMessage('settings_dns_add_custom_server_name_placeholder')}
                    value={dnsServerName}
                    onChange={handleDnsServerNameChange}
                    required
                />
                <Input
                    id="dns-address"
                    name="dns-address"
                    label={translator.getMessage('settings_dns_add_custom_server_address')}
                    placeholder={translator.getMessage('settings_dns_add_custom_server_address_placeholder')}
                    value={dnsServerAddress}
                    onChange={handleDnsServerAddressChange}
                    error={dnsServerAddressError}
                    required
                />
            </form>
        </Modal>
    );
});
