import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';

import { DnsSettingsServerModal } from './DnsSettingsServerModal';
import { normalizeDnsServerAddress, validateDnsServerAddress } from './validate';

export const DnsSettingsServerModalEdit = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);
    const {
        isCustomDnsModalOpen,
        customDnsServers,
        dnsServerToEdit,
        editCustomDnsServer,
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

        // `address` is dns address before editing,
        // `dnsServerAddress` is the state of dns address form.
        // if dns address was edited, it has to be verified.
        if (oldDnsServerAddress !== dnsServerAddress) {
            const dnsServerAddressError = validateDnsServerAddress(customDnsServers, dnsServerAddress);
            if (dnsServerAddressError) {
                return dnsServerAddressError;
            }
        }
        const normalizedDnsServerAddress = normalizeDnsServerAddress(dnsServerAddress);
        await editCustomDnsServer(id, dnsServerName, normalizedDnsServerAddress);
        notificationsStore.notifySuccess(
            // FIXME: Translation
            'Custom DNS server edited',
            {
                action: reactTranslator.getMessage('settings_exclusions_undo'),
                handler: () => editCustomDnsServer(id, oldDnsServerName, oldDnsServerAddress),
            },
        );

        return null;
    };

    return (
        <DnsSettingsServerModal
            title={reactTranslator.getMessage('settings_dns_edit_custom_server')}
            submitBtnTitle={reactTranslator.getMessage('settings_dns_add_custom_server_save')}
            open={isCustomDnsModalOpen && !!settingsStore.dnsServerToEdit}
            onSubmit={handleSubmit}
        />
    );
});
