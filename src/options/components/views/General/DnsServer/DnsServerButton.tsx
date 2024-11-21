import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { Controls } from '../../../ui/Controls';
import { Icon } from '../../../ui/Icon';

export const DnsServerButton = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { currentDnsServerName } = settingsStore;

    const handleClick = () => {
        settingsStore.setShowDnsSettings(true);
    };

    // FIXME: Translation
    return (
        <Controls
            title={reactTranslator.getMessage('settings_dns_label')}
            description={(
                <>
                    Resolve DNS requests, block ads and trackers,
                    and encrypt DNS traffic when you&apos;re connected to VPN
                    <br />
                    <br />
                    Current:
                    {' '}
                    {currentDnsServerName}
                </>
            )}
            action={<Icon name="arrow-down" className="dns-server__btn-icon" />}
            onClick={handleClick}
        />
    );
});
