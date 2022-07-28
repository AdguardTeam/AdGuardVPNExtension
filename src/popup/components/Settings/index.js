import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../stores';
import GlobalControl from './GlobalControl';
import Status from './Status';
import { APPEARANCE_THEMES } from '../../../lib/constants';

import './settings.pcss';

const MOTION_FOLDER_PATH = '../../../assets/motion/';

const Settings = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const {
        isConnected,
        appearanceTheme,
    } = settingsStore;

    const {
        premiumPromoEnabled,
        isPremiumToken,
    } = vpnStore;

    const settingsClass = classnames(
        'settings',
        { 'settings--active': isConnected },
        { 'settings--premium-promo': premiumPromoEnabled },
        { 'settings--trial': !isPremiumToken },
        { 'settings--feedback': !premiumPromoEnabled },
    );

    const sourcesMap = {
        light: {
            connected: `${MOTION_FOLDER_PATH}on-day.webm`,
            disconnected: `${MOTION_FOLDER_PATH}off-day.webm`,
        },
        dark: {
            connected: `${MOTION_FOLDER_PATH}on-day.webm`,
            disconnected: `${MOTION_FOLDER_PATH}off-day.webm`,
        },
    };

    const getSourcePath = () => {
        if (appearanceTheme === APPEARANCE_THEMES.DARK) {
            return isConnected ? sourcesMap.dark.connected : sourcesMap.dark.disconnected;
        }
        return isConnected ? sourcesMap.light.connected : sourcesMap.light.disconnected;
    };

    return (
        <div className={settingsClass}>
            <video aria-hidden="true" className="settings__video" playsInline autoPlay loop>
                <source src={getSourcePath()} type="video/webm" />
            </video>
            <div className="settings__main">
                <Status />
                <GlobalControl />
            </div>
        </div>
    );
});

export default Settings;
