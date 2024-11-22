import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { getForwarderUrl } from '../../../../../common/helpers';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { FORWARDER_URL_QUERIES } from '../../../../../background/config';
import { Button } from '../../../ui/Button';
import { Modal } from '../../../ui/Modal';
import { Input } from '../../../ui/Input';

import { normalizeDnsServerAddress, validateDnsServerAddress } from './validate';

export const DnsSettingsServerAddModal = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

    const {
        forwarderDomain,
        customDnsServers,
        dnsServerName,
        dnsServerAddress,
        setDnsServerName,
        setDnsServerAddress,
    } = settingsStore;

    const adguardKnownDnsKbUrl = getForwarderUrl(
        forwarderDomain,
        // FIXME: Add proper link
        FORWARDER_URL_QUERIES.ADGUARD_DNS_KB,
    );

    const [dnsServerAddressError, setDnsServerAddressError] = useState<string | null>(null);

    const handleOpenModal = () => {
        settingsStore.openCustomDnsModal();
    };

    const handleCloseModal = () => {
        setDnsServerName('');
        setDnsServerAddress('');
        setDnsServerAddressError(null);
        settingsStore.closeCustomDnsModal();
    };

    const handleOpenChange = (open: boolean) => {
        if (open) {
            handleOpenModal();
        } else {
            handleCloseModal();
        }
    };

    const handleDnsServerAddressChange = (value: string) => {
        setDnsServerAddress(value);
        if (dnsServerAddressError) {
            setDnsServerAddressError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const dnsServerAddressError = validateDnsServerAddress(customDnsServers, dnsServerAddress);
        if (dnsServerAddressError) {
            setDnsServerAddressError(dnsServerAddressError);
            return;
        }

        const normalizedDnsServerAddress = normalizeDnsServerAddress(dnsServerAddress);
        const dnsServer = await settingsStore.addCustomDnsServer(dnsServerName, normalizedDnsServerAddress);
        notificationsStore.notifySuccess(
            reactTranslator.getMessage('settings_dns_add_custom_server_notification_success'),
            {
                action: reactTranslator.getMessage('settings_exclusions_undo'),
                handler: () => settingsStore.removeCustomDnsServer(dnsServer.id),
            },
        );
        handleCloseModal();
    };

    const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleCloseModal();
    };

    return (
        <>
            <Button variant="ghost" beforeIconName="plus" onClick={handleOpenModal}>
                {reactTranslator.getMessage('settings_dns_add_custom_server')}
            </Button>
            <Modal
                title={reactTranslator.getMessage('settings_dns_add_custom_server')}
                description={
                    (
                        <a
                            href={adguardKnownDnsKbUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {/* FIXME: Translation */}
                            Known DNS Providers
                        </a>
                    )
                }
                open={settingsStore.isCustomDnsModalOpen}
                onOpenChange={handleOpenChange}
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
                        <Button type="submit">
                            {reactTranslator.getMessage('settings_dns_add_custom_server_save_and_select')}
                        </Button>
                        <Button variant="outline" type="reset">
                            {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </>
    );
});
