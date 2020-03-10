import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import './dns.pcss';
import translator from '../../../../lib/translator';
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

    // const getDNSType = async () => {
    //     // await settingsStore.getDNSType();
    //     const dnsType = await settingsStore.DNSType;
    //     console.log(`DNS TYPE: ${dnsType}`);
    //     return dnsType;
    // };

    const temporaryData = [{
        id: 'default',
        title: 'Default',
        desc: 'Automatically use your own DNS servers when connected to the VPN',
    }, {
        id: 'adguard-dns-unfiltered',
        title: 'Adguard DNS unfiltered',
        desc: 'Protects your device from malware',
    }, {
        id: 'adguard-dns',
        title: 'Adguard DNS',
        desc: 'Removes ads and protects your device from malware',
    }, {
        id: 'google-dns',
        title: 'Google DNS',
        desc: 'Free alternative DNS service by Google',
    }, {
        id: 'cloudflare-dns',
        title: 'Cloudflare DNS',
        desc: 'Free DNS service by Cloudflare',
    }];

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
                    options={temporaryData}
                    currentValue={settingsStore.DNSType}
                    optionChange={handleOptionChange}
                />
            </div>
        </>
    );
});

export default DNS;
