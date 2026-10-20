import React, { useContext, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { useHistory, useLocation } from 'react-router-dom';

import classNames from 'classnames';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { Icon } from '../../../../common/components/Icons';
import { ProfileMenu } from '../../../../common/components/ProfileMenu';
import { useOutsideClick } from '../../../../common/hooks/useOutsideClick';
import { rootStore } from '../../../stores';
import { PROFILES_PATH } from '../../Profiles/profileRoutes';

import styles from './profile-switcher.module.pcss';

/**
 * ProfileSwitcher component props.
 */
interface ProfileSwitcherProps {
    /**
     * Called when the switcher navigates to another screen.
     */
    onNavigate?: () => void;
}

/**
 * Sidebar profile switcher: a button with the active profile name
 * and a menu with the list of available profiles.
 */
export const ProfileSwitcher = observer(({ onNavigate }: ProfileSwitcherProps) => {
    const { profilesStore, telemetryStore } = useContext(rootStore);
    const history = useHistory();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const { profiles, activeProfileId } = profilesStore;

    const isProfilesScreen = location.pathname === PROFILES_PATH
        || location.pathname.startsWith(`${PROFILES_PATH}/`);

    useOutsideClick(ref, (): void => {
        setIsMenuOpen(false);
    });

    const handleToggle = (): void => {
        if (!isMenuOpen) {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.ProfileSelectorSettingsClick,
                TelemetryScreenName.ContextBasedScreen,
            );
        }
        setIsMenuOpen(!isMenuOpen);
    };

    const handleSelect = async (profileId: string): Promise<void> => {
        setIsMenuOpen(false);

        if (profileId === activeProfileId) {
            return;
        }

        await profilesStore.setActiveProfile(profileId);
    };

    const handleManage = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.ManageProfilesSettingsClick,
            TelemetryScreenName.ContextBasedScreen,
        );
        setIsMenuOpen(false);
        onNavigate?.();

        if (location.pathname !== PROFILES_PATH) {
            history.push(PROFILES_PATH);
        }
    };

    return (
        <div className={styles.root} ref={ref}>
            {isMenuOpen && (
                <ProfileMenu
                    className={styles.menu}
                    profiles={profiles}
                    activeProfileId={activeProfileId}
                    onSelect={handleSelect}
                    onManage={handleManage}
                />
            )}
            <button
                type="button"
                className={classNames(styles.button, isProfilesScreen && styles.active)}
                aria-expanded={isMenuOpen}
                aria-current={isProfilesScreen ? 'page' : undefined}
                onClick={handleToggle}
            >
                <Icon name="profile" className={styles.avatar} />
                <span className={styles.name}>
                    {profilesStore.activeProfileDisplayName}
                </span>
                <Icon
                    name="arrow-down"
                    color="gray"
                    rotation="clockwise"
                />
            </button>
        </div>
    );
});
