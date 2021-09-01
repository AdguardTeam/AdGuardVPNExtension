import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { DNS_SERVERS } from '../../../../background/dns/dnsConstants';
import { rootStore } from '../../../stores';
import { Select } from '../../ui/Select';
import { reactTranslator } from '../../../../common/reactTranslator';

export const Dns = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleDnsSelect = async (server) => {
        await settingsStore.setDnsServer(server);
    };

    return (
        <div className="settings__group">
            <div className="settings__item">
                <div>
                    <div className="settings__item-title">
                        {reactTranslator.getMessage('settings_dns_label')}
                    </div>
                    <div className="settings__item-desc">
                        {reactTranslator.getMessage('settings_dns_desc')}
                    </div>
                </div>
                <Select
                    options={DNS_SERVERS}
                    currentValue={settingsStore.dnsServer}
                    optionChange={handleDnsSelect}
                />
            </div>
        </div>
    );
});
