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
            isActive={webRTCEnabled}
            onToggle={handleToggle}
        />
    );
});
