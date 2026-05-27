import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translator';
import { IconButton } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';
import { Controls } from '../../ui/Controls';

interface DnsSettingsButtonProps {
    /**
     * Profile ID to read DNS data from.
     * When set, reads from profilesStore.dnsCache directly.
     * When omitted, uses dnsStore.currentDnsServerName (active profile).
     */
    profileId?: string;

    /**
     * Custom click handler.
     * Falls back to settingsStore.setShowDnsSettings(true).
     */
    onClick?: () => void;
}

export const DnsSettingsButton = observer(({ profileId, onClick }: DnsSettingsButtonProps) => {
    const { settingsStore, dnsStore } = useContext(rootStore);

    const dnsServerName = profileId
        ? dnsStore.getProfileDnsServerName(profileId)
        : dnsStore.currentDnsServerName;

    const handleClick = (): void => {
        if (onClick) {
            onClick();
        } else {
            settingsStore.setShowDnsSettings(true);
        }
    };

    return (
        <Controls
            title={translator.getMessage('settings_dns_label')}
            description={(
                <>
                    {translator.getMessage('settings_dns_description')}
                    <br />
                    <br />
                    {translator.getMessage('settings_description_current', {
                        mode: dnsServerName,
                    })}
                </>
            )}
            action={<IconButton name="arrow-down" rotation="clockwise" />}
            onClick={handleClick}
            className="dns-settings__btn"
        />
    );
});
