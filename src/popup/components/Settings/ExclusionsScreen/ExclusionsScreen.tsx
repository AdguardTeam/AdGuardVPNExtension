import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { rootStore } from '../../../stores';
import { ProfileSwitcher } from '../../Profiles/ProfileSwitcher';
import { SiteInfo } from '../SiteInfo';
import { Status } from '../Status';
import { BackgroundAnimation } from '../BackgroundAnimation';

export const ExclusionsScreen = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const removeFromExclusions = async (): Promise<void> => {
        await settingsStore.enableVpnOnCurrentTab();
    };

    const addToExclusions = async (): Promise<void> => {
        await settingsStore.disableVpnOnCurrentTab();
    };

    const onBtnClick = settingsStore.isCurrentTabExcluded
        ? removeFromExclusions
        : addToExclusions;

    return (
        <div className="settings">
            <BackgroundAnimation />
            <div className="settings__animation-overlay" />
            <div className="settings__main">
                <Status />
                <ProfileSwitcher />
                <button
                    onClick={onBtnClick}
                    type="button"
                    className="button button--medium button--main button--green"
                >
                    {reactTranslator.getMessage('popup_settings_enable_vpn_short')}
                </button>
                <SiteInfo />
            </div>
        </div>
    );
});
