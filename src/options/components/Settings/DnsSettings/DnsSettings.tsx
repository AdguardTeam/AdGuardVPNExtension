import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import { useHistory } from 'react-router-dom';

import { DNS_SERVERS, DNS_DEFAULT } from '../../../../background/dns/dnsConstants';
import { rootStore } from '../../../stores';
import { RadioButton } from '../../ui/RadioButton';
import { Title } from '../../ui/Title';
import { reactTranslator } from '../../../../common/reactTranslator';
import { CustomDnsServerModal } from './CustomDnsServerModal';

import './dns-settings.pcss';

export const DnsSettings = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const handleDnsSelect = async (event: React.MouseEvent<HTMLDivElement>): Promise<void> => {
        const dnsServerId = event.currentTarget.id;
        await settingsStore.setDnsServer(dnsServerId);
    };

    const history = useHistory();

    const goBackHandler = (): void => {
        history.push('/');
    };

    const closeAddDnsServerModal = (): void => {
        setAddModalOpen(false);
    };

    const openAddDnsServerModal = () => {
        setAddModalOpen(true);
    };

    const removeDnsServer = (dnsServerId: string): void => {
        settingsStore.removeCustomDnsServer(dnsServerId);
    };

    const openEditDnsServerModal = (): void => {
        setEditModalOpen(true);
    };

    const closeEditDnsServerModal = (): void => {
        setEditModalOpen(false);
    };

    const dnsServers = Object.keys(DNS_SERVERS);
    const popularDnsServers = dnsServers.filter((server) => server !== DNS_DEFAULT);

    const renderDnsServer = (dnsServerId: string) => {
        // @ts-ignore
        const dnsServerData = DNS_SERVERS[dnsServerId];
        if (!dnsServerData) {
            return (<div />);
        }
        return (
            <div
                key={dnsServerId}
                id={dnsServerId}
                className="settings__item dns-settings__item settings__item__dns-server"
                onClick={handleDnsSelect}
            >
                <RadioButton enabled={dnsServerId === settingsStore.dnsServer} />
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
                    className="settings__item dns-settings__item settings__item__dns-server"
                    onClick={handleDnsSelect}
                >
                    <RadioButton enabled={server.id === settingsStore.dnsServer} />
                    <div>
                        <div className="settings__item-title">{server.title}</div>
                        <div className="settings__item-desc">{server.ip}</div>
                    </div>
                    <div className="dns-settings__item__actions">
                        <button
                            type="button"
                            className="button button--icon"
                            onClick={openEditDnsServerModal}
                        >
                            <svg className="icon">
                                <use xlinkHref="#edit" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="button button--icon"
                            onClick={() => removeDnsServer(server.id)}
                        >
                            <svg className="icon">
                                <use xlinkHref="#basket" />
                            </svg>
                        </button>
                    </div>
                    {editModalOpen && (
                        <CustomDnsServerModal
                            isOpen={editModalOpen}
                            closeModal={closeEditDnsServerModal}
                            dnsServerData={server}
                            modalType="edit"
                        />
                    )}
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
            <CustomDnsServerModal
                isOpen={addModalOpen}
                closeModal={closeAddDnsServerModal}
                modalType="add"
            />
        </div>
    );
});
