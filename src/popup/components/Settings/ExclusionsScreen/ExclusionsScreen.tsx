import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { Status } from '../Status';
import { reactTranslator } from '../../../../common/reactTranslator';
import SiteInfo from '../SiteInfo';
import { BackgroundVideo } from '../BackgroundVideo';

export const ExclusionsScreen = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const removeFromExclusions = async () => {
        await settingsStore.enableVpnOnCurrentTab();
    };

    const addToExclusions = async () => {
        await settingsStore.disableVpnOnCurrentTab();
    };

    const buttonsInfo = {
        add: addToExclusions,
        remove: removeFromExclusions,
    };

    const button = settingsStore.isExcluded ? buttonsInfo.remove : buttonsInfo.add;

    return (
        <div className="settings">
            <BackgroundVideo exclusionsScreen />
            <div className="settings__video-overlay" />
            <div className="settings__main">
                <Status />
                <button
                    onClick={button}
                    type="button"
                    className="button button--medium button--green"
                >
                    {reactTranslator.getMessage('popup_settings_enable_vpn_short')}
                </button>
                <SiteInfo />
            </div>
        </div>
    );
});
