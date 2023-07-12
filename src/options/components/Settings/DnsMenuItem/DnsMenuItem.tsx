import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';

export const DnsMenuItem = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { currentDnsServerName, setShowDnsSettings } = settingsStore;

    const handleClick = () => {
        setShowDnsSettings(true);
    };

    return (
        <div className="settings__group">
            <button
                className="settings__item settings__item--dns-server"
                onClick={handleClick}
                type="button"
            >
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
            </button>
        </div>
    );
});
