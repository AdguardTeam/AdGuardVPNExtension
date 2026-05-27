import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { rootStore } from '../../../stores';
import { DnsSettings } from '../../General/DnsSettings';
import { getProfileRoute, PROFILES_PATH } from '../profileRoutes';

/**
 * Wrapper that sets dnsStore.profileId for the current route profile
 * and renders the shared DNS settings UI.
 */
export const ProfileDnsSettings = observer(() => {
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
        return <Redirect to={PROFILES_PATH} />;
    }

    if (dnsStore.profileId !== id) {
        return null;
    }

    const handleBack = (): void => {
        history.push(getProfileRoute(id));
    };

    return (
        <DnsSettings profileId={id} onBack={handleBack} />
    );
});
