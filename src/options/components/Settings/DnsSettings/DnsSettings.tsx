import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';

import { DNS_SERVERS, DNS_DEFAULT } from '../../../../background/dns/dnsConstants';
import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { reactTranslator } from '../../../../common/reactTranslator';
import { CustomDnsServerModal } from './CustomDnsServerModal';

import './dns-settings.pcss';

interface DnsServerData {
    id: string;
    title: string;
    ip1: string;
}

export const DnsSettings = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

    const handleDnsSelect = async (event: React.MouseEvent<HTMLDivElement>): Promise<void> => {
        const dnsServerId = event.currentTarget.id;
        await settingsStore.setDnsServer(dnsServerId);
    };

    const handleCustomDnsSelect = async (dnsServerId: string): Promise<void> => {
        await settingsStore.setDnsServer(dnsServerId);
    };

    const history = useHistory();

    const goBackHandler = (): void => {
        history.push('/');
    };

    const openAddDnsServerModal = () => {
        settingsStore.openCustomDnsModalOpen();
    };

    const removeDnsServer = (dnsServerData: DnsServerData): void => {
        const { id, title, ip1 } = dnsServerData;
        settingsStore.removeCustomDnsServer(id);
        notificationsStore.notifySuccess(
            reactTranslator.getMessage('settings_dns_delete_custom_server_notification'),
            {
                action: reactTranslator.getMessage('settings_exclusions_undo'),
                handler: () => settingsStore.addCustomDnsServer(title, ip1),
            },
        );
        if (settingsStore.dnsServer === id) {
            settingsStore.setDnsServer(DNS_DEFAULT);
        }
    };

    const openEditDnsServerModal = (server: DnsServerData): void => {
        settingsStore.setDnsServerToEdit(server);
        settingsStore.openCustomDnsModalOpen();
    };

    const dnsServers = Object.keys(DNS_SERVERS);
    const popularDnsServers = dnsServers.filter((server) => server !== DNS_DEFAULT);

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

    const renderDnsServer = (dnsServerId: string) => {
        const dnsServerData = DNS_SERVERS[dnsServerId];
        if (!dnsServerData) {
            return (<div />);
        }
        return (
            <div
                key={dnsServerId}
                id={dnsServerId}
                className="dns-settings__item"
                onClick={handleDnsSelect}
            >
                {renderRadioButton(dnsServerId)}
                <div>
                    <div className="settings__item-title">{dnsServerData.title}</div>
                    <div className="settings__item-desc">{dnsServerData.desc}</div>
                </div>
            </div>
        );
    };

    const renderCustomDnsServers = () => {
        return settingsStore.customDnsServers.map((server) => {
            return (
                <div
                    key={server.id}
                    className="dns-settings__item"
                    onClick={() => handleCustomDnsSelect(server.id)}
                >
                    {renderRadioButton(server.id)}
                    <div>
                        <div className="settings__item-title">{server.title}</div>
                        <div className="settings__item-desc">{server.ip1}</div>
                    </div>
                    <div className="dns-settings__item--actions">
                        <button
                            type="button"
                            className="button button--icon dns-settings__item--actions--button"
                            onClick={() => openEditDnsServerModal(server)}
                        >
                            <svg className="icon icon--button">
                                <use xlinkHref="#edit" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="button button--icon dns-settings__item--actions--button"
                            onClick={() => removeDnsServer(server)}
                        >
                            <svg className="icon icon--button">
                                <use xlinkHref="#basket" />
                            </svg>
                        </button>
                    </div>
                </div>
            );
        });
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
                {renderDnsServer(DNS_DEFAULT)}
            </div>
            <div>
                <div className="dns-settings__label">
                    {reactTranslator.getMessage('settings_dns_popular_servers')}
                </div>
                {popularDnsServers.map(renderDnsServer)}
            </div>
            <div>
                <div className="dns-settings__label">
                    {reactTranslator.getMessage('settings_dns_custom_servers')}
                </div>
                <div>
                    {renderCustomDnsServers()}
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
