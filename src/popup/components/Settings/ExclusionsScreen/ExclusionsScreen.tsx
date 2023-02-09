import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { Status } from '../Status';
import { reactTranslator } from '../../../../common/reactTranslator';
import { SiteInfo } from '../SiteInfo';
import { BackgroundAnimation } from '../BackgroundAnimation';
import { animationService } from '../BackgroundAnimation/animationStateMachine';
import { AnimationEvent } from '../../../../lib/constants';

export const ExclusionsScreen = observer(() => {
    const { settingsStore } = useContext(rootStore);

    useEffect(() => {
        animationService.send(AnimationEvent.ExclusionScreenDisplayed);
    });

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

    const button = settingsStore.isCurrentTabExcluded ? buttonsInfo.remove : buttonsInfo.add;

    return (
        <div className="settings">
            <BackgroundAnimation />
            <div className="settings__animation-overlay" />
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
