import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { ControlsSwitch } from '../ui/Controls';

interface WebRTCProps {
    /**
     * Profile ID to read/write WebRTC setting for.
     */
    profileId: string;
}

export const WebRTC = observer(({ profileId }: WebRTCProps) => {
    const { profilesStore } = useContext(rootStore);

    const isActive = profilesStore.webRtcCache.get(profileId) ?? false;

    const handleToggle = async (): Promise<void> => {
        profilesStore.toggleWebRtc(profileId);
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
