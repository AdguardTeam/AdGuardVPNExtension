import React, { useContext, useId, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';

/**
 * Return type for `onSubmit` method of modal.
 *
 * NOTE: If you are going to add more errors, do not forget to properly handle it.
 */
export interface DnsSettingsServerModalError {
    /**
     * Error message for DNS server name input.
     */
    dnsServerNameError?: string | null;

    /**
     * Error message for DNS server address input.
     */
    dnsServerAddressError?: string | null;
}

export interface DnsSettingsServerModalProps {
    /**
     * Title of modal.
     */
    title: React.ReactNode;

    /**
     * Description of modal.
     */
    description?: React.ReactNode;

    /**
     * Title of submit button.
     */
    submitBtnTitle?: React.ReactNode;

    /**
     * Is modal open.
     */
    isOpen: boolean;

    /**
     * Submit handler.
     *
     * @param dnsServerName DNS server name.
     * @param dnsServerAddress DNS server address.
     * @returns Object with error messages for inputs. If no errors, return null.
     */
    onSubmit: (dnsServerName: string, dnsServerAddress: string) => Promise<DnsSettingsServerModalError | null>;
}

export const DnsSettingsServerModal = observer(({
    title,
    description,
    submitBtnTitle,
    isOpen,
    onSubmit,
}: DnsSettingsServerModalProps) => {
    const { settingsStore } = useContext(rootStore);

    const {
        dnsServerName,
        dnsServerAddress,
    } = settingsStore;

    const formId = useId();

    const [dnsServerNameError, setDnsServerNameError] = useState<string | null>(null);
    const [dnsServerAddressError, setDnsServerAddressError] = useState<string | null>(null);

    const handleCloseModal = (): void => {
        settingsStore.closeCustomDnsModal();
        settingsStore.setDnsServerName('');
        settingsStore.setDnsServerAddress('');
        settingsStore.setDnsServerToEdit(null);
        setDnsServerNameError(null);
        setDnsServerAddressError(null);
    };

    const handleDnsServerNameChange = (value: string): void => {
        settingsStore.setDnsServerName(value);
        if (dnsServerNameError) {
            setDnsServerNameError(null);
        }
    };

    const handleDnsServerAddressChange = (value: string): void => {
        settingsStore.setDnsServerAddress(value);
        if (dnsServerAddressError) {
            setDnsServerAddressError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const errors = await onSubmit(dnsServerName, dnsServerAddress);
        if (errors) {
            if (errors.dnsServerNameError) {
                setDnsServerNameError(errors.dnsServerNameError);
            }
            if (errors.dnsServerAddressError) {
                setDnsServerAddressError(errors.dnsServerAddressError);
            }
            return;
        }

        handleCloseModal();
    };

    const handleReset = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        handleCloseModal();
    };

    return (
        <Modal
            title={title}
            description={description}
            isOpen={isOpen}
            actions={(
                <>
                    <Button type="submit" form={formId}>
                        {submitBtnTitle}
                    </Button>
                    <Button variant="outlined" type="reset" form={formId}>
                        {translator.getMessage('settings_exclusion_modal_cancel')}
                    </Button>
                </>
            )}
            onClose={handleCloseModal}
        >
            <form
                id={formId}
                className="modal__form"
                onSubmit={handleSubmit}
                onReset={handleReset}
            >
                <Input
                    id="dns-name"
                    name="dns-name"
                    label={translator.getMessage('settings_dns_add_custom_server_name')}
                    placeholder={translator.getMessage('settings_dns_add_custom_server_name_placeholder')}
                    value={dnsServerName}
                    onChange={handleDnsServerNameChange}
                    error={dnsServerNameError}
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
            </form>
        </Modal>
    );
});
