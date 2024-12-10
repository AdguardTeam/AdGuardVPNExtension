import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { translator } from '../../../common/translator';
import { ControlsSwitch } from '../ui/Controls';

export const WebRTC = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { webRTCEnabled } = settingsStore;

    const handleToggle = async (): Promise<void> => {
        await settingsStore.setWebRTCValue(!webRTCEnabled);
    };

    return (
        <ControlsSwitch
            title={translator.getMessage('settings_webrtc_label')}
            // FIXME: Update translation text
            // description={translator.getMessage('settings_webrtc_desc')}
            description="Block WebRTC, a known vulnerability that can leak your real IP address even if you use a proxy or VPN"
            isActive={webRTCEnabled}
            onToggle={handleToggle}
        />
    );
});
