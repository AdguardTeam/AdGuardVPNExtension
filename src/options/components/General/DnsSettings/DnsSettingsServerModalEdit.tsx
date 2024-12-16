import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';

import { DnsSettingsServerModal } from './DnsSettingsServerModal';
import { normalizeDnsServerAddress, validateDnsServerAddress } from './validate';

export const DnsSettingsServerModalEdit = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

    const {
        isCustomDnsModalOpen,
        customDnsServers,
        dnsServerToEdit,
    } = settingsStore;

    const handleSubmit = async (dnsServerName: string, dnsServerAddress: string) => {
        if (!dnsServerToEdit) {
            return null;
        }
        const {
            id,
            title: oldDnsServerName,
            address: oldDnsServerAddress,
        } = dnsServerToEdit;

        if (oldDnsServerAddress !== dnsServerAddress) {
            // `oldDnsServerAddress` is dns address before editing,
            // `dnsServerAddress` is the state of dns address form.
            // if dns address was edited, it has to be verified.
            const dnsServerAddressError = validateDnsServerAddress(customDnsServers, dnsServerAddress);
            if (dnsServerAddressError) {
                return dnsServerAddressError;
            }
        } else if (oldDnsServerName === dnsServerName) {
            // If nothing changed just return
            return null;
        }
        const normalizedDnsServerAddress = normalizeDnsServerAddress(dnsServerAddress);
        await settingsStore.editCustomDnsServer(id, dnsServerName, normalizedDnsServerAddress);
        notificationsStore.notifySuccess(
            translator.getMessage('settings_dns_edit_custom_server_notification'),
            {
                action: translator.getMessage('settings_exclusions_undo'),
                handler: () => settingsStore.editCustomDnsServer(id, oldDnsServerName, oldDnsServerAddress),
            },
        );

        return null;
    };

    return (
        <DnsSettingsServerModal
            title={translator.getMessage('settings_dns_edit_custom_server')}
            submitBtnTitle={translator.getMessage('settings_dns_add_custom_server_save')}
            isOpen={isCustomDnsModalOpen && !!dnsServerToEdit}
            onSubmit={handleSubmit}
        />
    );
});
