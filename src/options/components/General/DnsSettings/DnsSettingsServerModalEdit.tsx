import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryScreenName } from '../../../../background/telemetry';
import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';

import { DnsSettingsServerModal, type DnsSettingsServerModalError } from './DnsSettingsServerModal';
import {
    normalizeDnsServerName,
    normalizeDnsServerAddress,
    validateDnsServerName,
    validateDnsServerAddress,
} from './validate';

export const DnsSettingsServerModalEdit = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    const {
        isCustomDnsModalOpen,
        customDnsServers,
        dnsServerToEdit,
    } = settingsStore;

    const isOpen = isCustomDnsModalOpen && !!dnsServerToEdit;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogEditCustomDns,
        isOpen,
    );

    const handleSubmit = async (
        dnsServerName: string,
        dnsServerAddress: string,
    ): Promise<DnsSettingsServerModalError | null> => {
        if (!dnsServerToEdit) {
            return null;
        }

        const {
            id,
            title: oldDnsServerName,
            address: oldDnsServerAddress,
        } = dnsServerToEdit;

        const isDnsServerNameChanged = oldDnsServerName !== dnsServerName;
        const isDnsServerAddressChanged = oldDnsServerAddress !== dnsServerAddress;

        // If nothing changed just return
        if (!isDnsServerNameChanged && !isDnsServerAddressChanged) {
            return null;
        }

        // Normalize and validate new name if it was changed
        let normalizedDnsServerName = oldDnsServerName;
        let dnsServerNameError = null;
        if (isDnsServerNameChanged) {
            normalizedDnsServerName = normalizeDnsServerName(dnsServerName);
            dnsServerNameError = validateDnsServerName(normalizedDnsServerName);
        }

        // Normalize and validate new address if it was changed
        let normalizedDnsServerAddress = oldDnsServerAddress;
        let dnsServerAddressError = null;
        if (isDnsServerAddressChanged) {
            normalizedDnsServerAddress = normalizeDnsServerAddress(dnsServerAddress);
            dnsServerAddressError = validateDnsServerAddress(customDnsServers, normalizedDnsServerAddress);
        }

        // If there are errors return them
        if (dnsServerNameError || dnsServerAddressError) {
            return {
                dnsServerNameError,
                dnsServerAddressError,
            };
        }

        await settingsStore.editCustomDnsServer(
            id,
            normalizedDnsServerName,
            normalizedDnsServerAddress,
        );

        return null;
    };

    return (
        <DnsSettingsServerModal
            title={translator.getMessage('settings_dns_edit_custom_server')}
            submitBtnTitle={translator.getMessage('settings_dns_add_custom_server_save')}
            isOpen={isOpen}
            onSubmit={handleSubmit}
        />
    );
});
