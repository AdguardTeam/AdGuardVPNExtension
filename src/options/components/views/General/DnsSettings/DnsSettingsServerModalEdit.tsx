import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';

import { DnsSettingsServerModal } from './DnsSettingsServerModal';
import { normalizeDnsServerAddress, validateDnsServerAddress } from './validate';

export const DnsSettingsServerModalEdit = observer(() => {
    const { settingsStore } = useContext(rootStore);
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
        const { address } = dnsServerToEdit;

        // `address` is dns address before editing,
        // `dnsServerAddress` is the state of dns address form.
        // if dns address was edited, it has to be verified.
        if (address !== dnsServerAddress) {
            const dnsServerAddressError = validateDnsServerAddress(customDnsServers, dnsServerAddress);
            if (dnsServerAddressError) {
                return dnsServerAddressError;
            }
        }
        const normalizedDnsServerAddress = normalizeDnsServerAddress(dnsServerAddress);
        await editCustomDnsServer(dnsServerName, normalizedDnsServerAddress);
        // FIXME: Add undo ability and translation
        // notificationsStore.notifySuccess(
        //     'Custom DNS server added',
        //     {
        //         action: reactTranslator.getMessage('settings_exclusions_undo'),
        //         handler: () => removeCustomDnsServer(dnsServer.id),
        //     },
        // );

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
