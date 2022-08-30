import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import Status from '../Status';
import { reactTranslator } from '../../../../common/reactTranslator';
import SiteInfo from '../SiteInfo';
import { BackgroundVideo } from '../BackgroundVideo';
import { APPEARANCE_THEMES, videoSourcesMap } from '../../../../lib/constants';

export const ExclusionsScreen = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { appearanceTheme } = settingsStore;

    const darkThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = darkThemeMediaQuery.matches
        ? APPEARANCE_THEMES.DARK
        : APPEARANCE_THEMES.LIGHT;

    const [systemTheme, setSystemTheme] = useState(currentTheme);

    const systemThemeChangeHandler = ((e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? APPEARANCE_THEMES.DARK : APPEARANCE_THEMES.LIGHT);
    });

    useEffect(() => {
        darkThemeMediaQuery.addEventListener('change', systemThemeChangeHandler);
        return () => darkThemeMediaQuery.removeEventListener('change', systemThemeChangeHandler);
    }, []);

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

    const videoSources = appearanceTheme === APPEARANCE_THEMES.SYSTEM
        ? videoSourcesMap[systemTheme]
        : videoSourcesMap[appearanceTheme];

    const backgroundVideoUrl = videoSources.disconnected;

    return (
        <div className="settings">
            <BackgroundVideo videoUrl={backgroundVideoUrl} />
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
