import React, { useContext, type ReactElement } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { translator } from '../../../common/translator';
import { isDefaultProfileId } from '../../../common/profiles';
import { type ActionMenuItem, ActionMenu } from '../../../common/components/ActionMenu';
import { rootStore } from '../../stores';

import styles from './profiles.module.pcss';

/**
 * Actions that can be performed on a profile.
 */
enum ProfileAction {
    Use = 'use',
    Rename = 'rename',
    Delete = 'delete',
}

/**
 * Builds list of actions depending on profile type and selection state.
 *
 * @param isDefault Whether the profile is the default one.
 * @param isActive Whether the profile is currently active.
 * @returns List of actions for the action menu.
 */
const getActions = (isDefault: boolean, isActive: boolean): ActionMenuItem<ProfileAction>[] => [
    {
        value: ProfileAction.Use,
        title: translator.getMessage('settings_profiles_action_use'),
        hidden: isActive,
    },
    {
        value: ProfileAction.Rename,
        title: translator.getMessage('settings_profiles_action_rename'),
        hidden: isDefault,
    },
    {
        value: ProfileAction.Delete,
        title: translator.getMessage('settings_profiles_action_delete'),
        className: styles.actionDanger,
        hidden: isDefault,
    },
];

type ProfileActionsProps = {
    /**
     * Profile ID.
     */
    profileId: string;

    /**
     * Called when the rename action is selected.
     */
    onRename: () => void;

    /**
     * Called when the delete action is selected.
     */
    onDelete: () => void;
};

/**
 * Actions dropdown for a profile.
 * Hides itself when no actions are available.
 */
export const ProfileActions = observer(({
    profileId,
    onRename,
    onDelete,
}: ProfileActionsProps): ReactElement | null => {
    const { profilesStore, telemetryStore } = useContext(rootStore);

    const profile = profilesStore.profiles.find((p) => p.id === profileId);

    if (!profile) {
        return null;
    }

    const isDefault = isDefaultProfileId(profileId);
    const isActive = profilesStore.isActive(profileId);
    const actions = getActions(isDefault, isActive);
    const hasVisibleActions = actions.some((a) => !a.hidden);

    const handleAction = async (action: ProfileAction): Promise<void> => {
        switch (action) {
            case ProfileAction.Use:
                await profilesStore.setActiveProfile(profileId);
                break;
            case ProfileAction.Rename:
                telemetryStore.sendCustomEvent(
                    TelemetryActionName.ActionsRenameProfileClick,
                    TelemetryScreenName.ProfileSettingsScreen,
                );
                onRename();
                break;
            case ProfileAction.Delete:
                telemetryStore.sendCustomEvent(
                    TelemetryActionName.ActionsDeleteProfileClick,
                    TelemetryScreenName.ProfileSettingsScreen,
                );
                onDelete();
                break;
            default:
                break;
        }
    };

    if (!hasVisibleActions) {
        return null;
    }

    return (
        <ActionMenu
            buttonClassName={styles.actionsButton}
            label={translator.getMessage('settings_profiles_actions')}
            items={actions}
            onAction={handleAction}
        />
    );
});
