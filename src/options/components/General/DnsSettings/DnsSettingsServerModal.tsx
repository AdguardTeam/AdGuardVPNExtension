import React, { useContext, useState } from 'react';
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
    open: boolean;
    onSubmit: (dnsServerName: string, dnsServerAddress: string) => Promise<string | null>;
}

export const DnsSettingsServerModal = observer(({
    title,
    description,
    submitBtnTitle,
    open,
    onSubmit,
}: DnsSettingsServerModalProps) => {
    const { settingsStore } = useContext(rootStore);

    const {
        dnsServerName,
        dnsServerAddress,
    } = settingsStore;

    const [dnsServerAddressError, setDnsServerAddressError] = useState<string | null>(null);

    const handleCloseModal = () => {
        settingsStore.setDnsServerName('');
        settingsStore.setDnsServerAddress('');
        setDnsServerAddressError(null);
        settingsStore.closeCustomDnsModal();
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
            open={open}
            onClose={handleCloseModal}
        >
            <form onSubmit={handleSubmit} onReset={handleReset} className="form">
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
                <div className="form__actions">
                    <Button type="submit">
                        {submitBtnTitle}
                    </Button>
                    <Button variant="outline" type="reset">
                        {translator.getMessage('settings_exclusion_modal_cancel')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
});
