import React, { useContext, useRef, useState } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { Icon } from '../../../../common/components/Icons';
import { ProfileMenu } from '../../../../common/components/ProfileMenu';
import { useOutsideClick } from '../../../../common/hooks/useOutsideClick';
import { log } from '../../../../common/logger';
import { messenger } from '../../../../common/messenger';
import { rootStore } from '../../../stores';

import styles from './profile-switcher.module.pcss';

/**
 * Popup profile switcher: shows the active profile name
 * and opens the menu with the list of available profiles.
 */
export const ProfileSwitcher = observer(() => {
    const { vpnStore, telemetryStore } = useContext(rootStore);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const { profiles, activeProfileId, activeProfileName } = vpnStore;

    useOutsideClick(ref, (): void => {
        setIsMenuOpen(false);
    });

    const handleToggle = (): void => {
        if (!isMenuOpen) {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.ProfileSelectorClick,
                TelemetryScreenName.HomeScreen,
            );
        }
        setIsMenuOpen(!isMenuOpen);
    };

    const handleSelect = async (profileId: string): Promise<void> => {
        setIsMenuOpen(false);

        if (profileId === activeProfileId) {
            return;
        }

        try {
            await messenger.switchProfile(profileId);
        } catch (e) {
            log.error('[vpn.ProfileSwitcher]: Failed to switch profile', e);
        }
    };

    const handleManage = async (): Promise<void> => {
        setIsMenuOpen(false);

        telemetryStore.sendCustomEvent(
            TelemetryActionName.ManageProfilesClick,
            TelemetryScreenName.HomeScreen,
        );

        try {
            await messenger.openProfilesPage();
            window.close();
        } catch (e) {
            log.error('[vpn.ProfileSwitcher]: Failed to open profiles page', e);
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
                className={styles.button}
                aria-expanded={isMenuOpen}
                onClick={handleToggle}
            >
                <span className={styles.name}>{activeProfileName}</span>
                <Icon
                    name="arrow-down"
                    rotation="clockwise"
                />
            </button>
        </div>
    );
});
