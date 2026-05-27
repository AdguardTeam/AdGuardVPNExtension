import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { translator } from '../../../common/translator';
import { messenger } from '../../../common/messenger';
import { log } from '../../../common/logger';
import { rootStore } from '../../stores';
import { ControlsSwitch } from '../ui/Controls';

interface WebRTCProps {
    /**
     * Profile ID to read/write WebRTC setting for.
     */
    profileId: string;

    /**
     * Whether the component is rendered inside a profile context.
     */
    isProfileContext: boolean;
}

/**
 * Toggle for per-profile WebRTC leak prevention.
 */
export const WebRTC = observer(({ profileId, isProfileContext }: WebRTCProps) => {
    const { profilesStore, telemetryStore } = useContext(rootStore);
    const pendingRef = useRef(false);

    const isActive = profilesStore.webRtcCache[profileId] ?? false;

    const handleToggle = async (): Promise<void> => {
        if (pendingRef.current) {
            return;
        }
        pendingRef.current = true;
        try {
            const newValue = !isActive;
            if (isProfileContext && !newValue) {
                telemetryStore.sendCustomEvent(
                    TelemetryActionName.TurnOffWebRTC,
                    TelemetryScreenName.NewProfilesSettingsScreen,
                );
            }
            await messenger.setProfileWebRtc(profileId, newValue);
            profilesStore.updateWebRtcCache(profileId, newValue);
        } catch (e) {
            log.error('[vpn.WebRTC]: Failed to toggle WebRTC handling', e);
        } finally {
            pendingRef.current = false;
        }
    };

    return (
        <ControlsSwitch
            title={translator.getMessage('settings_webrtc_label')}
            description={(
                <>
                    <span>
                        {translator.getMessage('settings_webrtc_desc')}
                    </span>
                    <br />
                    <span className="webrtc-warning">
                        {translator.getMessage('settings_webrtc_warning')}
                    </span>
                </>
            )}
            isActive={isActive}
            onToggle={handleToggle}
        />
    );
});
