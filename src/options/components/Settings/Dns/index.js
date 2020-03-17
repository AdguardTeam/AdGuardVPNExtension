import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import './dns.pcss';
import translator from '../../../../lib/translator';
import dnsList from '../../../../background/dns/dnsData';
import rootStore from '../../../stores';

import Switch from '../../ui/Switch';
import Select from '../../ui/Select';

const Dns = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const dnsToggle = async (e) => {
        await settingsStore.setDnsUsage(e.currentTarget.checked);
    };

    const handleDnsSelect = async (type) => {
        await settingsStore.setDnsType(type);
    };

    return (
        <>
            <div className="settings__group">
                <Switch
                    id="dns"
                    title={translator.translate('settings_dns_label')}
                    desc={translator.translate('settings_dns_desc')}
                    handleToggle={dnsToggle}
                    checked={settingsStore.dnsEnabled}
                />
                <Select
                    id="dnsSelect"
                    disabled={!settingsStore.dnsEnabled}
                    options={dnsList}
                    currentValue={settingsStore.dnsType}
                    optionChange={handleDnsSelect}
                />
            </div>
        </>
    );
});

export default Dns;
