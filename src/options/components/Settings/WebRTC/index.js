import React, { Fragment, useContext } from 'react';
import { observer } from 'mobx-react';
import translator from '../../../../lib/translator';
import rootStore from '../../../stores';

import Switch from '../../ui/Switch';

const Webrtc = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleCheckboxChange = async (e) => {
        await settingsStore.setWebRTC(e.currentTarget.checked);
    };

    return (
        <Fragment>
            <div className="settings__group">
                <Switch
                    id="webrtc"
                    title={translator.translate('settings_webrtc_label')}
                    desc={translator.translate('settings_webrtc_desc')}
                    handleToggle={handleCheckboxChange}
                    checked={settingsStore.webRTCEnabled}
                />
            </div>
        </Fragment>
    );
});

export default Webrtc;
