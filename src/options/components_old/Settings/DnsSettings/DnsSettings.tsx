import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../../../background/dns/dnsConstants';
import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { reactTranslator } from '../../../../common/reactTranslator';
import type { DnsServerData } from '../../../../background/schema';

import { CustomDnsServerModal } from './CustomDnsServerModal';

import './dns-settings.pcss';

export const DnsSettings = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

    const handleDnsSelect = async (
        event: React.MouseEvent<HTMLDivElement | HTMLButtonElement>,
    ): Promise<void> => {
        // To prevent multiple handles of one click from radio-button and
        // from parent div container.
        event.stopPropagation();

        const dnsServerId = event.currentTarget.id;
        await settingsStore.setDnsServer(dnsServerId);
    };

    const goBackHandler = (): void => {
        settingsStore.setShowDnsSettings(false);
    };

    const openAddDnsServerModal = () => {
        settingsStore.openCustomDnsModal();
    };

    const removeDnsServer = (
        event: React.MouseEvent,
        dnsServerId: string,
    ): void => {
        event.stopPropagation();
        settingsStore.removeCustomDnsServer(dnsServerId);
        notificationsStore.notifySuccess(
            reactTranslator.getMessage('settings_dns_delete_custom_server_notification'),
            {
                action: reactTranslator.getMessage('settings_exclusions_undo'),
                handler: () => settingsStore.restoreCustomDnsServersData(),
            },
        );
    };

    const openEditDnsServerModal = (
        event: React.MouseEvent,
        server: DnsServerData,
    ): void => {
        // To not trigger parent dns-button selector.
        event.stopPropagation();
        settingsStore.setDnsServerToEdit(server);
        settingsStore.openCustomDnsModal();
    };

    const renderRadioButton = (dnsServerId: string) => {
        const enabled = dnsServerId === settingsStore.dnsServer;
        const xlinkHref = classnames({
            '#bullet_on': enabled,
            '#bullet_off': !enabled,
        });
        // TODO: Dirty hack to support a11y, should use native <input type="radio">.
        return (
            <button
                type="button"
                id={dnsServerId}
                name={dnsServerId}
                onClick={handleDnsSelect}
                className="radio__container"
            >
                <svg className="radio__icon">
                    <use xlinkHref={xlinkHref} />
                </svg>
            </button>
        );
    };

    const renderActions = (dnsServerData: DnsServerData) => {
        return (
            <div className="dns-settings__item--actions">
                <button
                    type="button"
                    className="button button--icon dns-settings__item--actions--button"
                    onClick={(event) => openEditDnsServerModal(event, dnsServerData)}
                >
                    <svg className="icon icon--button">
                        <use xlinkHref="#edit" />
                    </svg>
                </button>
                <button
                    type="button"
                    className="button button--icon dns-settings__item--actions--button"
                    onClick={(event) => removeDnsServer(event, dnsServerData.id)}
                >
                    <svg className="icon icon--button">
                        <use xlinkHref="#basket" />
                    </svg>
                </button>
            </div>
        );
    };

    const renderDnsServer = (dnsServerData: DnsServerData) => {
        if (!dnsServerData) {
            return null;
        }
        const {
            id,
            title,
            address,
            desc,
        } = dnsServerData;

        // Custom servers doesn't have description
        const isCustom = !desc;

        return (
            <div
                id={id}
                key={id}
                className="dns-settings__item"
                onClick={handleDnsSelect}
            >
                {renderRadioButton(id)}
                <div>
                    <div className="dns-settings__item-title">{title}</div>
                    <div className="dns-settings__item-desc">{isCustom ? address : desc}</div>
                </div>
                {isCustom && renderActions(dnsServerData)}
            </div>
        );
    };

    return (
        <div className="dns-settings">
            <div className="dns-settings__title">
                <button className="back-button" type="button" onClick={goBackHandler}>
                    <svg className="icon icon--button">
                        <use xlinkHref="#back-arrow" />
                    </svg>
                </button>
                <Title
                    title={reactTranslator.getMessage('settings_dns_label')}
                    onClick={goBackHandler}
                />
            </div>
            <div>
                {renderDnsServer(DEFAULT_DNS_SERVER)}
            </div>
            <div className="dns-settings__items-group">
                <div className="dns-settings__label">
                    {reactTranslator.getMessage('settings_dns_popular_servers')}
                </div>
                {POPULAR_DNS_SERVERS.map(renderDnsServer)}
            </div>
            <div className="dns-settings__items-group">
                <div className="dns-settings__label">
                    {reactTranslator.getMessage('settings_dns_custom_servers')}
                </div>
                <div>
                    {settingsStore.customDnsServers.map(renderDnsServer)}
                </div>
                <button
                    type="button"
                    className="simple-button dns-settings__add-button"
                    onClick={openAddDnsServerModal}
                >
                    <svg className="icon icon--button">
                        <use xlinkHref="#plus" />
                    </svg>
                    <div className="dns-settings__add-button__label">
                        {reactTranslator.getMessage('settings_dns_add_custom_server')}
                    </div>
                </button>
            </div>
            <CustomDnsServerModal />
        </div>
    );
});
