import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translator';
import { IconButton } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';
import { Controls } from '../../ui/Controls';

interface DnsSettingsButtonProps {
    /**
     * Profile ID to read DNS data from.
     */
    profileId: string;

    /**
     * Custom click handler.
     */
    onClick: () => void;
}

export const DnsSettingsButton = observer(({ profileId, onClick }: DnsSettingsButtonProps) => {
    const { dnsStore } = useContext(rootStore);

    const dnsServerName = dnsStore.getProfileDnsServerName(profileId);

    return (
        <Controls
            title={translator.getMessage('settings_dns_label')}
            description={(
                <>
                    {translator.getMessage('settings_dns_description')}
                    <br />
                    <br />
                    <span className="controls__state">{dnsServerName}</span>
                </>
            )}
            action={<IconButton name="arrow-down" rotation="clockwise" />}
            onClick={onClick}
            className="dns-settings__btn"
        />
    );
});
