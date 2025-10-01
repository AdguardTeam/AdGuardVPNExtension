import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translator';
import { IconButton } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';
import { Controls } from '../../ui/Controls';

export const DnsSettingsButton = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { currentDnsServerName } = settingsStore;

    const handleClick = (): void => {
        settingsStore.setShowDnsSettings(true);
    };

    return (
        <Controls
            title={translator.getMessage('settings_dns_label')}
            description={(
                <>
                    {translator.getMessage('settings_dns_description')}
                    <br />
                    <br />
                    {translator.getMessage('settings_dns_description_current', {
                        dnsServerName: currentDnsServerName,
                    })}
                </>
            )}
            action={<IconButton name="arrow-down" rotation="clockwise" />}
            onClick={handleClick}
            className="dns-settings__btn"
        />
    );
});
