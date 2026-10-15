import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import {
    Redirect,
    useHistory,
    useLocation,
    useParams,
} from 'react-router-dom';

import { rootStore } from '../../../stores';
import { Exclusions } from '../../Exclusions';
import { getProfileSubScreenOrigin, PROFILES_PATH } from '../profileRoutes';

/**
 * Wrapper that switches ExclusionsStore to the given profile
 * and renders the shared Exclusions UI.
 */
export const ProfileExclusions = observer(() => {
    const { profilesStore, exclusionsStore } = useContext(rootStore);
    const history = useHistory();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();

    const profile = profilesStore.profiles.find((p) => p.id === id);

    useEffect(() => {
        exclusionsStore.setProfileId(id);

        return (): void => {
            exclusionsStore.setProfileId(undefined);
        };
    }, [id, exclusionsStore]);

    if (!profile) {
        return <Redirect to={PROFILES_PATH} />;
    }

    if (exclusionsStore.profileId !== id) {
        return null;
    }

    const handleBack = (): void => {
        history.push(getProfileSubScreenOrigin(location.search, id));
    };

    return (
        <Exclusions onBack={handleBack} />
    );
});
