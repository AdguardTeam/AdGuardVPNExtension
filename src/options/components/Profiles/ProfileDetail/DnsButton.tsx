import React, { useContext } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../../../common/dnsConstants';
import { translator } from '../../../../common/translator';
import { IconButton } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';
import { Controls } from '../../ui/Controls';

/**
 * Navigable row showing current DNS server for a profile.
 * Clicking navigates to the profile's DNS settings page.
 */
export const DnsButton = (): React.ReactElement => {
    const { profilesStore } = useContext(rootStore);
    const history = useHistory();
    const { id } = useParams<{ id: string }>();

    const cacheEntry = profilesStore.dnsCache.get(id);
    const selectedDnsServerId = cacheEntry?.selectedDnsServer ?? DEFAULT_DNS_SERVER.id;
    const allServers = [
        DEFAULT_DNS_SERVER,
        ...POPULAR_DNS_SERVERS,
        ...(cacheEntry?.customDnsServers ?? []),
    ];
    const serverName = allServers.find((s) => s.id === selectedDnsServerId)?.title ?? null;

    const handleClick = (): void => {
        history.push(`/profiles/${id}/dns`);
    };

    return (
        <Controls
            title={translator.getMessage('settings_dns_label')}
            description={translator.getMessage('settings_dns_description_current', {
                dnsServerName: serverName,
            })}
            action={<IconButton name="arrow-down" rotation="clockwise" />}
            onClick={handleClick}
        />
    );
};
