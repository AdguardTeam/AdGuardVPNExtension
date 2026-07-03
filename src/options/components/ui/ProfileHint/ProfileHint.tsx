import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { rootStore } from '../../../stores';

import './profile-hint.pcss';

interface ProfileHintProps {
    /**
     * Profile ID to reference. Falls back to the currently active profile.
     */
    profileId?: string;

    /**
     * Optional click handler. When provided, the indicator renders as a
     * `<button>` element that invokes this callback with the resolved
     * profile ID on click.
     */
    onClick?: (profileId: string) => void;
}

/**
 * Displays "Applies to your **ProfileName** profile" hint
 * when the given profileId matches a known profile and the user
 * has more than one profile.
 */
export const ProfileHint = observer(({ profileId, onClick }: ProfileHintProps) => {
    const { profilesStore } = useContext(rootStore);

    const effectiveId = profileId ?? profilesStore.activeProfileId;
    const profile = profilesStore.profiles.find((p) => p.id === effectiveId);

    if (!profile || profilesStore.profiles.length <= 1) {
        return null;
    }

    const content = reactTranslator.getMessage('settings_applies_to_profile', {
        profile_name: profilesStore.getDisplayName(profile),
        b: (chunks: string) => <b>{chunks}</b>,
    });

    if (onClick) {
        return (
            <button
                type="button"
                className="profile-hint profile-hint--interactive"
                onClick={(e: React.MouseEvent): void => {
                    e.stopPropagation();
                    onClick(effectiveId);
                }}
            >
                {content}
            </button>
        );
    }

    return (
        <div className="profile-hint">
            {content}
        </div>
    );
});
