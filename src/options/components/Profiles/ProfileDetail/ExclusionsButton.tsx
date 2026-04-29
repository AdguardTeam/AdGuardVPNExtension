import React, { useContext } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { ExclusionsMode } from '../../../../common/exclusionsConstants';
import { translator } from '../../../../common/translator';
import { IconButton } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';
import { Controls } from '../../ui/Controls';

/**
 * Navigable row showing current exclusion mode for a profile.
 * Clicking navigates to the profile's exclusions page.
 */
export const ExclusionsButton = (): React.ReactElement => {
    const { profilesStore } = useContext(rootStore);
    const history = useHistory();
    const { id } = useParams<{ id: string }>();

    const cacheEntry = profilesStore.exclusionsCache.get(id);
    const currentMode = cacheEntry?.currentMode ?? ExclusionsMode.Regular;

    const modeTitle = currentMode === ExclusionsMode.Regular
        ? translator.getMessage('settings_exclusion_general_title')
        : translator.getMessage('settings_exclusion_selective_title');

    const handleClick = (): void => {
        history.push(`/profiles/${id}/exclusions`);
    };

    return (
        <Controls
            title={translator.getMessage('settings_exclusion_title')}
            description={translator.getMessage('settings_exclusion_description_current', {
                mode: modeTitle,
            })}
            action={<IconButton name="arrow-down" rotation="clockwise" />}
            onClick={handleClick}
        />
    );
};
