import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { DNS_SERVERS } from '../../../../background/dns/dnsConstants';
import rootStore from '../../../stores';

import './dns.pcss';
import Select from '../../ui/Select';
import { reactTranslator } from '../../../../common/reactTranslator';

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
                        {reactTranslator.getMessage('settings_dns_label')}
                    </div>
                    <div className="dns-desc">
                        {reactTranslator.getMessage('settings_dns_desc')}
                    </div>
                    <Select
                        options={DNS_SERVERS}
                        currentValue={settingsStore.dnsServer}
                        optionChange={handleDnsSelect}
                    />
                </div>
            </div>
        </>
    );
});

export default Dns;
