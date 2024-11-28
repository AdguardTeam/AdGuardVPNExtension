import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { ControlsSwitch } from '../ui/Controls';

export const WebRTC = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { webRTCEnabled } = settingsStore;

    const handleToggle = async (): Promise<void> => {
        await settingsStore.setWebRTCValue(!webRTCEnabled);
    };

    // FIXME: Translation
    return (
        <ControlsSwitch
            title={reactTranslator.getMessage('settings_webrtc_label')}
            description="Block WebRTC, a known vulnerability that can leak your real IP address even if you use a proxy or VPN"
            value={webRTCEnabled}
            onToggle={handleToggle}
        />
    );
});
