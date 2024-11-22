import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { getForwarderUrl } from '../../../../../common/helpers';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { FORWARDER_URL_QUERIES } from '../../../../../background/config';

import { DnsSettingsServerModal } from './DnsSettingsServerModal';
import { normalizeDnsServerAddress, validateDnsServerAddress } from './validate';

export const DnsSettingsServerModalAdd = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);
    const {
        forwarderDomain,
        isCustomDnsModalOpen,
        customDnsServers,
        dnsServerToEdit,
        addCustomDnsServer,
        removeCustomDnsServer,
    } = settingsStore;

    const adguardKnownDnsKbUrl = getForwarderUrl(
        forwarderDomain,
        // FIXME: Add proper link
        FORWARDER_URL_QUERIES.ADGUARD_DNS_KB,
    );

    const handleSubmit = async (dnsServerName: string, dnsServerAddress: string) => {
        const dnsServerAddressError = validateDnsServerAddress(customDnsServers, dnsServerAddress);
        if (dnsServerAddressError) {
            return dnsServerAddressError;
        }
        const normalizedDnsServerAddress = normalizeDnsServerAddress(dnsServerAddress);
        const dnsServer = await addCustomDnsServer(dnsServerName, normalizedDnsServerAddress);
        notificationsStore.notifySuccess(
            reactTranslator.getMessage('settings_dns_add_custom_server_notification_success'),
            {
                action: reactTranslator.getMessage('settings_exclusions_undo'),
                handler: () => removeCustomDnsServer(dnsServer.id),
            },
        );
        return null;
    };

    return (
        <DnsSettingsServerModal
            title={reactTranslator.getMessage('settings_dns_add_custom_server')}
            description={(
                <a href={adguardKnownDnsKbUrl} target="_blank" rel="noreferrer">
                    {/* FIXME: Translation */}
                    Known DNS Providers
                </a>
            )}
            submitBtnTitle={reactTranslator.getMessage('settings_dns_add_custom_server_save_and_select')}
            open={isCustomDnsModalOpen && !dnsServerToEdit}
            onSubmit={handleSubmit}
        />
    );
});
