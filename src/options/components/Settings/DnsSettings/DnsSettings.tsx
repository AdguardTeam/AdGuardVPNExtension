import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { useHistory } from 'react-router-dom';

import { DNS_SERVERS, DNS_DEFAULT } from '../../../../background/dns/dnsConstants';
import { rootStore } from '../../../stores';
import { RadioButton } from '../../ui/RadioButton';
import { Title } from '../../ui/Title';
import { reactTranslator } from '../../../../common/reactTranslator';

import './dns-settings.pcss';

export const DnsSettings = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleDnsSelect = async (event: React.MouseEvent<HTMLDivElement>) => {
        const dnsServerId = event.currentTarget.id;
        await settingsStore.setDnsServer(dnsServerId);
    };

    const history = useHistory();

    const goBackHandler = (): void => {
        history.push('/');
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
        </div>
    );
});
