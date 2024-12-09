import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { getForwarderUrl } from '../../../../common/helpers';
import { translator } from '../../../../common/translator';
import { FORWARDER_URL_QUERIES } from '../../../../background/config';

import { DnsSettingsServerModal } from './DnsSettingsServerModal';
import { normalizeDnsServerAddress, validateDnsServerAddress } from './validate';

export const DnsSettingsServerModalAdd = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);
    const {
        forwarderDomain,
        isCustomDnsModalOpen,
        customDnsServers,
        dnsServerToEdit,
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
        const dnsServer = await settingsStore.addCustomDnsServer(dnsServerName, normalizedDnsServerAddress);
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
                    {/* FIXME: Add translation text */}
                    {/* {translator.getMessage('settings_dns_add_known_providers')} */}
                    Known DNS providers
                </a>
            )}
            submitBtnTitle={translator.getMessage('settings_dns_add_custom_server_save_and_select')}
            open={isCustomDnsModalOpen && !dnsServerToEdit}
            onSubmit={handleSubmit}
        />
    );
});
