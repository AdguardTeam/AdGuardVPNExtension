import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { Controls } from '../../ui/Controls';
import { IconButton } from '../../ui/Icon';

export const DnsSettingsButton = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { currentDnsServerName } = settingsStore;

    const handleClick = () => {
        settingsStore.setShowDnsSettings(true);
    };

    return (
        <Controls
            title={reactTranslator.getMessage('settings_dns_label')}
            description={(
                <>
                    {reactTranslator.getMessage('settings_dns_description')}
                    <br />
                    <br />
                    {reactTranslator.getMessage('settings_dns_current', {
                        dnsServerName: currentDnsServerName,
                    })}
                </>
            )}
            action={<IconButton name="arrow-down" className="dns-settings__btn-icon" />}
            onClick={handleClick}
        />
    );
});
