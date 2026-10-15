import React, { type ReactElement } from 'react';

import classNames from 'classnames';

import { getProfileDisplayName } from '../../profiles';
import { translator } from '../../translator';
import { Icon } from '../Icons';

import styles from './profile-menu.module.pcss';

/**
 * Profile item displayed in the menu.
 */
export interface ProfileMenuItem {
    /**
     * Profile id.
     */
    id: string;

    /**
     * Name of the profile.
     */
    name: string;
}

/**
 * ProfileMenu component props.
 */
export interface ProfileMenuProps {
    /**
     * Profiles to display.
     */
    profiles: ProfileMenuItem[];

    /**
     * Id of the active profile.
     */
    activeProfileId: string;

    /**
     * Profile select handler.
     */
    onSelect: (profileId: string) => void;

    /**
     * "Manage profiles" click handler.
     */
    onManage: () => void;

    /**
     * Additional class name.
     * Consumers pass their own positioning and sizing rules here: the menu is
     * centered in the popup and opens to the side of the sidebar switcher.
     */
    className?: string;
}

/**
 * Menu with the list of available profiles and a link to the profiles screen.
 * Shared between the sidebar switcher and the popup.
 */
export function ProfileMenu({
    profiles,
    activeProfileId,
    onSelect,
    onManage,
    className,
}: ProfileMenuProps): ReactElement {
    return (
        <div className={classNames(styles.root, className)}>
            <div className={styles.list}>
                {profiles.map((profile) => {
                    const isActive = profile.id === activeProfileId;

                    return (
                        <button
                            key={profile.id}
                            type="button"
                            className={classNames(styles.item, 'has-tab-focus')}
                            onClick={(): void => onSelect(profile.id)}
                        >
                            <span className={styles.icon}>
                                {isActive && <Icon name="tick" className={styles.tick} />}
                            </span>
                            <span className={styles.name}>
                                {getProfileDisplayName(profile.id, profile.name)}
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className={styles.divider} />
            <button
                type="button"
                className={classNames(styles.item, 'has-tab-focus')}
                onClick={onManage}
            >
                <span className={styles.icon}>
                    <Icon name="edit" className={styles.manageIcon} />
                </span>
                <span className={styles.name}>
                    {translator.getMessage('settings_profiles_manage')}
                </span>
            </button>
        </div>
    );
}
