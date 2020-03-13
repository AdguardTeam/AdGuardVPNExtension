import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import './dns.pcss';
import translator from '../../../../lib/translator';
import dns from '../../../../background/dns';
import rootStore from '../../../stores';

import Switch from '../../ui/Switch';
import Select from '../../ui/Select';

const Dns = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleCheckboxChange = async (e) => {
        await settingsStore.setDnsUsage(e.currentTarget.checked);
    };

    const handleOptionChange = async (type) => {
        await settingsStore.setDnsType(type);
    };

    return (
        <>
            <div className="settings__group">
                <Switch
                    id="dns"
                    title={translator.translate('settings_dns_label')}
                    desc={translator.translate('settings_dns_desc')}
                    handleToggle={handleCheckboxChange}
                    checked={settingsStore.dnsEnabled}
                />
                <Select
                    id="dnsSelect"
                    disabled={!settingsStore.dnsEnabled}
                    options={dns.list}
                    currentValue={settingsStore.dnsType}
                    optionChange={handleOptionChange}
                />
            </div>
        </>
    );
});

export default Dns;
