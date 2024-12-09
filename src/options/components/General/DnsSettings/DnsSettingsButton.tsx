import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translator';
import { rootStore } from '../../../stores';
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
            title={translator.getMessage('settings_dns_label')}
            description={(
                <>
                    {/* FIXME: Add translation text */}
                    {/* {translator.getMessage('settings_dns_description')} */}
                    Resolve DNS requests, block ads and trackers, and encrypt
                    DNS traffic when you&apos;re connected to VPN
                    <br />
                    <br />
                    {/* FIXME: Add translation text */}
                    {/* {translator.getMessage('settings_dns_current', {
                        dnsServerName: currentDnsServerName,
                    })} */}
                    Current:
                    {' '}
                    {currentDnsServerName}
                </>
            )}
            action={<IconButton name="arrow-down" className="dns-settings__btn-icon" />}
            onClick={handleClick}
        />
    );
});
