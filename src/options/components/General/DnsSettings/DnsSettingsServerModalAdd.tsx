import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { getForwarderUrl } from '../../../../common/helpers';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';
import { TelemetryScreenName } from '../../../../background/telemetry';
import { FORWARDER_URL_QUERIES } from '../../../../background/config';

import { DnsSettingsServerModal, type DnsSettingsServerModalError } from './DnsSettingsServerModal';
import {
    normalizeDnsServerName,
    normalizeDnsServerAddress,
    validateDnsServerName,
    validateDnsServerAddress,
} from './validate';

export const DnsSettingsServerModalAdd = observer(() => {
    const { settingsStore, notificationsStore, telemetryStore } = useContext(rootStore);

    const {
        forwarderDomain,
        isCustomDnsModalOpen,
        customDnsServers,
        dnsServerToEdit,
    } = settingsStore;

    const isOpen = isCustomDnsModalOpen && !dnsServerToEdit;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogAddCustomDns,
        isOpen,
    );

    const adguardKnownDnsKbUrl = getForwarderUrl(
        forwarderDomain,
        FORWARDER_URL_QUERIES.ADGUARD_DNS_PROVIDERS_KB,
    );

    const handleSubmit = async (
        dnsServerName: string,
        dnsServerAddress: string,
    ): Promise<DnsSettingsServerModalError | null> => {
        // Normalize and validate DNS server name
        const normalizedDnsServerName = normalizeDnsServerName(dnsServerName);
        const dnsServerNameError = validateDnsServerName(normalizedDnsServerName);

        // Normalize and validate DNS server address
        const normalizedDnsServerAddress = normalizeDnsServerAddress(dnsServerAddress);
        const dnsServerAddressError = validateDnsServerAddress(customDnsServers, normalizedDnsServerAddress);

        // If there are errors, return them
        if (dnsServerNameError || dnsServerAddressError) {
            return {
                dnsServerNameError,
                dnsServerAddressError,
            };
        }

        const dnsServer = await settingsStore.addCustomDnsServer(
            normalizedDnsServerName,
            normalizedDnsServerAddress,
        );

        notificationsStore.notifySuccess(
            translator.getMessage('settings_dns_add_custom_server_notification_success'),
            {
                action: translator.getMessage('settings_exclusions_undo'),
                handler: () => settingsStore.removeCustomDnsServer(dnsServer.id),
            },
        );
        return null;
    };

    return (
        <DnsSettingsServerModal
            title={translator.getMessage('settings_dns_add_custom_server')}
            description={(
                <a href={adguardKnownDnsKbUrl} target="_blank" rel="noreferrer">
                    {translator.getMessage('settings_dns_add_custom_server_info')}
                </a>
            )}
            submitBtnTitle={translator.getMessage('settings_dns_add_custom_server_save_and_select')}
            isOpen={isOpen}
            onSubmit={handleSubmit}
        />
    );
});
