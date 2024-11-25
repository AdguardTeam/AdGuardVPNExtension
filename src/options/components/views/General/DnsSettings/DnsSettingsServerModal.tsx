import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { Button } from '../../../ui/Button';
import { Modal } from '../../../ui/Modal';
import { Input } from '../../../ui/Input';

export interface DnsSettingsServerModalProps {
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    submitBtnTitle?: string | React.ReactNode;
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
        setDnsServerName,
        setDnsServerAddress,
    } = settingsStore;

    const [dnsServerAddressError, setDnsServerAddressError] = useState<string | null>(null);

    const handleCloseModal = () => {
        setDnsServerName('');
        setDnsServerAddress('');
        setDnsServerAddressError(null);
        settingsStore.closeCustomDnsModal();
    };

    const handleDnsServerAddressChange = (value: string) => {
        setDnsServerAddress(value);
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
            {/* FIXME: Translation */}
            <form onSubmit={handleSubmit} onReset={handleReset} className="form">
                <Input
                    id="dns-name"
                    name="dns-name"
                    label={reactTranslator.getMessage('settings_dns_add_custom_server_name')}
                    placeholder="My DNS server"
                    value={dnsServerName}
                    onChange={setDnsServerName}
                    required
                />
                <Input
                    id="dns-address"
                    name="dns-address"
                    label="Server address"
                    placeholder="IP address, sdns://, quic://, https://, h3://, or tls://"
                    value={dnsServerAddress}
                    onChange={handleDnsServerAddressChange}
                    error={dnsServerAddressError}
                    required
                />
                <div className="form__actions">
                    <Button type="submit" size="large">
                        {submitBtnTitle}
                    </Button>
                    <Button variant="outline" type="reset" size="large">
                        {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
});
