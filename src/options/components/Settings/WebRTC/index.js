import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import rootStore from '../../../stores';
import Switch from '../../ui/Switch';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

const Webrtc = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleCheckboxChange = async (e) => {
        await settingsStore.setWebRTCValue(e.currentTarget.checked);
    };

    return (
        <>
            <div className="settings__group">
                <Switch
                    id="webrtc"
                    title={reactTranslator.translate('settings_webrtc_label')}
                    desc={reactTranslator.translate('settings_webrtc_desc')}
                    handleToggle={handleCheckboxChange}
                    checked={settingsStore.webRTCEnabled}
                />
            </div>
        </>
    );
});

export default Webrtc;
