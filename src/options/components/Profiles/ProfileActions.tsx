import React, { type ReactElement } from 'react';

import { translator } from '../../../common/translator';
import { type SelectOptionItem, Select } from '../../../common/components/Select';

import styles from './profiles.module.pcss';

/**
 * Actions that can be performed on a profile.
 */
enum ProfileAction {
    Default = 'default',
    Use = 'use',
    Rename = 'rename',
    Delete = 'delete',
}

/**
 * Builds list of actions depending on profile type and selection state.
 *
 * @param isDefault Whether the profile is the default one.
 * @param isActive Whether the profile is currently active.
 * @returns List of actions for the Select dropdown.
 */
const getActions = (isDefault: boolean, isActive: boolean): SelectOptionItem<ProfileAction>[] => [
    {
        value: ProfileAction.Default,
        title: translator.getMessage('settings_profiles_actions'),
        shouldSkip: true,
    },
    {
        value: ProfileAction.Use,
        title: translator.getMessage('settings_profiles_action_use'),
        shouldSkip: isActive,
    },
    {
        value: ProfileAction.Rename,
        title: translator.getMessage('settings_profiles_action_rename'),
        shouldSkip: isDefault,
    },
    {
        value: ProfileAction.Delete,
        title: translator.getMessage('settings_profiles_action_delete'),
        className: styles.actionDanger,
        shouldSkip: isDefault,
    },
];

type ProfileActionsProps = {
    /**
     * Whether the profile is the default one.
     */
    isDefault: boolean;

    /**
     * Whether the profile is currently active.
     */
    isActive: boolean;
};

/**
 * Actions dropdown for a profile.
 * Hides itself when no actions are available.
 */
export const ProfileActions = ({ isDefault, isActive }: ProfileActionsProps): ReactElement | null => {
    const actions = getActions(isDefault, isActive);
    const hasVisibleActions = actions.some((a) => !a.shouldSkip);

    const handleAction = (action: ProfileAction): void => {
        switch (action) {
            case ProfileAction.Use:
            case ProfileAction.Rename:
            case ProfileAction.Delete:
                // FIXME: AG-52847, AG-52848 Implement these actions
                alert(`"${action}" action is not implemented yet.`); // eslint-disable-line no-alert
                break;
            default:
                break;
        }
    };

    if (!hasVisibleActions) {
        return null;
    }

    return (
        <Select
            buttonClassName={styles.actionsButton}
            value={ProfileAction.Default}
            options={actions}
            onChange={handleAction}
        />
    );
};
