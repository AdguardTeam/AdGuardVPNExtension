import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import translator from '../../../../lib/translator';
import { dnsData } from '../../../../background/dns';
import rootStore from '../../../stores';

import './dns.pcss';
import Select from '../../ui/Select';

const Dns = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleDnsSelect = async (server) => {
        await settingsStore.setDnsServer(server);
    };

    return (
        <>
            <div className="settings__group">
                <div className="dns">
                    <div className="dns-title">
                        {translator.translate('settings_dns_label')}
                    </div>
                    <div className="dns-desc">
                        {translator.translate('settings_dns_desc')}
                    </div>
                    <Select
                        options={dnsData}
                        currentValue={settingsStore.dnsServer}
                        optionChange={handleDnsSelect}
                    />
                </div>
            </div>
        </>
    );
});

export default Dns;
