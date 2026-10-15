import React from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { Title } from '../ui/Title';

import { ProfilesList } from './ProfilesList';

import styles from './profiles.module.pcss';

/**
 * Profiles settings page component.
 */
export const Profiles = observer(() => {
    return (
        <div className={styles.root}>
            <Title
                title={translator.getMessage('settings_profiles_title')}
                subtitle={translator.getMessage('settings_profiles_subtitle')}
            />
            <ProfilesList />
        </div>
    );
});
