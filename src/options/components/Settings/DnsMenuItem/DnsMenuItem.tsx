import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { useHistory } from 'react-router-dom';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { DNS_SETTINGS_QUERY } from '../../../../background/dns/dnsConstants';

export const DnsMenuItem = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { currentDnsServerName } = settingsStore;

    const history = useHistory();

    const handleClick = () => {
        history.push(`?${DNS_SETTINGS_QUERY}`);
    };

    return (
        <div className="settings__group">
            <div className="settings__item settings__item__dns-server" onClick={handleClick}>
                <div className="settings__item-content">
                    <div className="settings__item-title">
                        {reactTranslator.getMessage('settings_dns_label')}
                    </div>
                    <div className="settings__item-desc">
                        {currentDnsServerName}
                    </div>
                    <svg className="icon icon--button">
                        <use xlinkHref="#arrow" />
                    </svg>
                </div>
            </div>
        </div>
    );
});
