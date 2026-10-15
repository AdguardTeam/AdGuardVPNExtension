import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { reactTranslator } from '../../../common/reactTranslator';
import { translator } from '../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { ProfileSettings } from '../Profiles/ProfileSettings';
import { PROFILES_PATH } from '../Profiles/profileRoutes';

import { Theme } from './Theme';
import { Language } from './Language';
import { ContextMenus } from './ContextMenus';
import { HelpUsImprove } from './HelpUsImprove';
import { DnsSettings } from './DnsSettings';

import './general.pcss';
import styles from './general.module.pcss';

export const General = observer(() => {
    const {
        settingsStore,
        telemetryStore,
        profilesStore,
    } = useContext(rootStore);
    const { showDnsSettings, isHelpUsImproveModalOpen } = settingsStore;
    const { activeProfile } = profilesStore;

    const profileName = activeProfile ? profilesStore.getDisplayName(activeProfile) : '';

    const canSendTelemetry = !showDnsSettings // `SettingsDnsServersScreen` is rendered on top of this screen
        && !isHelpUsImproveModalOpen; // `UsageDataDialog` is rendered on top of this screen

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.GeneralSettingsScreen,
        canSendTelemetry,
    );

    const handleCurrentProfileClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.AppliesToProfileClick,
            TelemetryScreenName.GeneralSettingsScreen,
        );
    };

    if (showDnsSettings) {
        return <DnsSettings />;
    }

    return (
        <>
            {activeProfile && (
                <>
                    <Title
                        className={styles.screenTitle}
                        title={translator.getMessage('settings_title')}
                    />
                    <div className={styles.profile}>
                        <div className={styles.profileTitle}>
                            {reactTranslator.getMessage('settings_current_profile', {
                                profile_name: profileName,
                                b: (chunks: string) => (
                                    <Link
                                        to={PROFILES_PATH}
                                        className={styles.profileLink}
                                        onClick={handleCurrentProfileClick}
                                    >
                                        {chunks}
                                    </Link>
                                ),
                            })}
                        </div>
                        <div className={styles.profileDescription}>
                            {translator.getMessage('settings_current_profile_description')}
                        </div>
                    </div>
                    <ProfileSettings profileId={activeProfile.id} />
                </>
            )}

            <Title
                className={styles.sectionTitle}
                title={translator.getMessage('settings_general_title')}
                subtitle={translator.getMessage('settings_general_description')}
            />
            <Theme />
            <Language />
            <ContextMenus />
            <HelpUsImprove />
        </>
    );
});
