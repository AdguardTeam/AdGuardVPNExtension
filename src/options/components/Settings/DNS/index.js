import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import './dns.pcss';
import translator from '../../../../lib/translator';
import dns from '../../../../background/dns';
import rootStore from '../../../stores';

import Switch from '../../ui/Switch';
import Select from '../../ui/Select';

const DNS = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleCheckboxChange = async (e) => {
        await settingsStore.setDNSUsage(e.currentTarget.checked);
    };

    const handleOptionChange = async (type) => {
        await settingsStore.setDNSType(type);
    };

    return (
        <>
            <div className="settings__group">
                <Switch
                    id="dns"
                    title={translator.translate('settings_dns_label')}
                    desc={translator.translate('settings_dns_desc')}
                    handleToggle={handleCheckboxChange}
                    checked={settingsStore.DNSEnabled}
                />
                <Select
                    id="dnsSelect"
                    disabled={!settingsStore.DNSEnabled}
                    options={dns.list}
                    currentValue={settingsStore.DNSType}
                    optionChange={handleOptionChange}
                />
            </div>
        </>
    );
});

export default DNS;
