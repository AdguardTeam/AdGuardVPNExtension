import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { rootStore } from '../../../stores';
import { DnsSettings } from '../../General/DnsSettings';

/**
 * Wrapper that switches DnsStore to the given profile
 * and renders the shared DnsSettings UI.
 */
export const ProfileDns = observer(() => {
    const { profilesStore, dnsStore } = useContext(rootStore);
    const history = useHistory();
    const { id } = useParams<{ id: string }>();

    const profile = profilesStore.profiles.find((p) => p.id === id);

    useEffect(() => {
        dnsStore.setProfileId(id);

        return (): void => {
            dnsStore.setProfileId(undefined);
        };
    }, [id, dnsStore]);

    if (!profile) {
        return <Redirect to="/profiles" />;
    }

    const handleBack = (): void => {
        history.push(`/profiles/${id}`);
    };

    return (
        <DnsSettings onBack={handleBack} />
    );
});
