import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';

import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../../../background/dns/dnsConstants';
import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { reactTranslator } from '../../../../common/reactTranslator';
import { CustomDnsServerModal } from './CustomDnsServerModal';
import { DnsServerData } from '../../../../common/components/constants';

import './dns-settings.pcss';

export const DnsSettings = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

    const handleDnsSelect = async (event: React.MouseEvent<HTMLDivElement>): Promise<void> => {
        const dnsServerId = event.currentTarget.id;
        await settingsStore.setDnsServer(dnsServerId);
    };

    const history = useHistory();

    const goBackHandler = (): void => {
        history.push('/');
    };

    const openAddDnsServerModal = () => {
        settingsStore.openCustomDnsModalOpen();
    };

    const removeDnsServer = (
        event: React.MouseEvent<HTMLButtonElement>,
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
        event: React.MouseEvent<HTMLButtonElement>,
        server: DnsServerData,
    ): void => {
        event.stopPropagation();
        settingsStore.setDnsServerToEdit(server);
        settingsStore.openCustomDnsModalOpen();
    };

    const renderRadioButton = (dnsServerId: string) => {
        const enabled = dnsServerId === settingsStore.dnsServer;
        const xlinkHref = classnames({
            '#bullet_on': enabled,
            '#bullet_off': !enabled,
        });
        return (
            <svg className="radio__icon">
                <use xlinkHref={xlinkHref} />
            </svg>
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
                key={id}
                id={id}
                className="dns-settings__item"
                onClick={handleDnsSelect}
            >
                {renderRadioButton(id)}
                <div>
                    <div className="settings__item-title">{title}</div>
                    <div className="settings__item-desc">{isCustom ? address : desc}</div>
                </div>
                {isCustom && renderActions(dnsServerData)}
            </div>
        );
    };

    return (
        <div className="dns-settings">
            <div className="dns-settings__title">
                <button className="dns-settings__back" type="button" onClick={goBackHandler}>
                    <svg className="icon icon--button">
                        <use xlinkHref="#back-arrow" />
                    </svg>
                </button>
                <Title title={reactTranslator.getMessage('settings_dns_label')} />
            </div>
            <div>
                {renderDnsServer(DEFAULT_DNS_SERVER)}
            </div>
            <div>
                <div className="dns-settings__label">
                    {reactTranslator.getMessage('settings_dns_popular_servers')}
                </div>
                {POPULAR_DNS_SERVERS.map(renderDnsServer)}
            </div>
            <div>
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
                    {reactTranslator.getMessage('settings_dns_add_custom_server')}
                </button>
            </div>
            <CustomDnsServerModal />
        </div>
    );
});
