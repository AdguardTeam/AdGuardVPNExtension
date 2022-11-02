import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { Switch } from '../../ui/Switch';
import { reactTranslator } from '../../../../common/reactTranslator';

export const WebRTC = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { webRTCEnabled } = settingsStore;

    const handleCheckboxChange = async (): Promise<void> => {
        await settingsStore.setWebRTCValue(!webRTCEnabled);
    };

    return (
        <div className="settings__group">
            <Switch
                title={reactTranslator.getMessage('settings_webrtc_label')}
                desc={reactTranslator.getMessage('settings_webrtc_desc')}
                handleToggle={handleCheckboxChange}
                checked={webRTCEnabled}
            />
        </div>
    );
});
