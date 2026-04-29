import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Redirect, useHistory, useParams } from 'react-router-dom';

import { rootStore } from '../../../stores';
import { Exclusions } from '../../Exclusions';

/**
 * Wrapper that switches ExclusionsStore to the given profile
 * and renders the shared Exclusions UI.
 */
export const ProfileExclusions = observer(() => {
    const { profilesStore, exclusionsStore } = useContext(rootStore);
    const history = useHistory();
    const { id } = useParams<{ id: string }>();

    const profile = profilesStore.profiles.find((p) => p.id === id);

    useEffect(() => {
        exclusionsStore.setProfileId(id);

        return (): void => {
            exclusionsStore.setProfileId(undefined);
        };
    }, [id, exclusionsStore]);

    if (!profile) {
        return <Redirect to="/profiles" />;
    }

    const handleBack = (): void => {
        history.push(`/profiles/${id}`);
    };

    return (
        <Exclusions onBack={handleBack} />
    );
});
