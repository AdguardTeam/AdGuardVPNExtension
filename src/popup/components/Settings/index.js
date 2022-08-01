import React, { useContext, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../stores';
import GlobalControl from './GlobalControl';
import Status from './Status';
import { APPEARANCE_THEMES } from '../../../lib/constants';
import { STATE } from '../../../background/connectivity/connectivityService/connectivityConstants';

import './settings.pcss';

const MOTION_FOLDER_PATH = '../../../assets/motion/';

const Settings = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const {
        connectivityState,
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
        [APPEARANCE_THEMES.LIGHT]: {
            [STATE.CONNECTED]: `${MOTION_FOLDER_PATH}on-day.webm`,
            [STATE.DISCONNECTED_IDLE]: `${MOTION_FOLDER_PATH}off-day.webm`,
            [STATE.CONNECTING_IDLE]: `${MOTION_FOLDER_PATH}switch-on-day.webm`,
            [STATE.DISCONNECTING]: `${MOTION_FOLDER_PATH}switch-off-day.webm`,
        },
        [APPEARANCE_THEMES.DARK]: {
            [STATE.CONNECTED]: `${MOTION_FOLDER_PATH}on-night.webm`,
            [STATE.DISCONNECTED_IDLE]: `${MOTION_FOLDER_PATH}off-night.webm`,
            [STATE.CONNECTING_IDLE]: `${MOTION_FOLDER_PATH}switch-on-night.webm`,
            [STATE.DISCONNECTING]: `${MOTION_FOLDER_PATH}switch-off-night.webm`,
        },
    };

    const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? [APPEARANCE_THEMES.DARK]
        : [APPEARANCE_THEMES.LIGHT];

    const sourcePath = appearanceTheme === APPEARANCE_THEMES.SYSTEM
        ? sourcesMap[systemTheme][connectivityState.value]
        : sourcesMap[appearanceTheme][connectivityState.value];

    const renderVideo = (url) => {
        const videoRef = useRef();

        useEffect(() => {
            videoRef.current?.load();
        }, [url]);

        return (
            <video ref={videoRef} aria-hidden="true" className="settings__video" playsInline autoPlay loop>
                <source src={url} type="video/webm" />
            </video>
        );
    };

    return (
        <div className={settingsClass}>
            {renderVideo(sourcePath)}
            <div className="settings__main">
                <Status />
                <GlobalControl />
            </div>
        </div>
    );
});

export default Settings;
