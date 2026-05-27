import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { rootStore } from '../../../stores';

interface ProfileHintProps {
    profileId?: string;
}

/**
 * Displays "Applies to your **ProfileName** profile" hint
 * when the given profileId matches a known profile.
 */
export const ProfileHint = observer(({ profileId }: ProfileHintProps) => {
    const { profilesStore } = useContext(rootStore);

    const effectiveId = profileId ?? profilesStore.activeProfileId;
    const profile = profilesStore.profiles.find((p) => p.id === effectiveId);

    if (!profile || profilesStore.profiles.length <= 1) {
        return null;
    }

    return (
        <div>
            {reactTranslator.getMessage('settings_applies_to_profile', {
                profile_name: profilesStore.getDisplayName(profile),
                b: (chunks: string) => <b>{chunks}</b>,
            })}
        </div>
    );
});
