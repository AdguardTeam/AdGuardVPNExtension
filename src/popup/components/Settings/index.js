import React, { useContext, useEffect, useRef, useState } from 'react';
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

    const [introHidden, setIntroHidden] = useState(false);

    const settingsClass = classnames(
        'settings',
        { 'settings--active': isConnected },
        { 'settings--premium-promo': premiumPromoEnabled },
        { 'settings--trial': !isPremiumToken },
        { 'settings--feedback': !premiumPromoEnabled },
    );

    const videoClass = classnames(
        'settings__video',
        { hidden: introHidden },
    );

    const sourcesMap = {
        [APPEARANCE_THEMES.LIGHT]: {
            [STATE.CONNECTED]: {
                intro: `${MOTION_FOLDER_PATH}switch-on-day.webm`,
                video: `${MOTION_FOLDER_PATH}on-day.webm`,
            },
            [STATE.DISCONNECTED_IDLE]: {
                intro: `${MOTION_FOLDER_PATH}switch-off-day.webm`,
                video: `${MOTION_FOLDER_PATH}off-day.webm`,
            },
            [STATE.CONNECTING_IDLE]: {
                intro: `${MOTION_FOLDER_PATH}off-day.webm`,
                video: `${MOTION_FOLDER_PATH}off-day.webm`,
            },
            // [STATE.DISCONNECTING]: `${MOTION_FOLDER_PATH}switch-off-day.webm`,
        },
        [APPEARANCE_THEMES.DARK]: {
            [STATE.CONNECTED]: {
                intro: `${MOTION_FOLDER_PATH}switch-on-night.webm`,
                video: `${MOTION_FOLDER_PATH}on-night.webm`,
            },
            [STATE.DISCONNECTED_IDLE]: {
                intro: `${MOTION_FOLDER_PATH}switch-off-night.webm`,
                video: `${MOTION_FOLDER_PATH}off-night.webm`,
            },
            [STATE.CONNECTING_IDLE]: {
                intro: `${MOTION_FOLDER_PATH}off-night.webm`,
                video: `${MOTION_FOLDER_PATH}off-night.webm`,
            },
            // [STATE.DISCONNECTING]: `${MOTION_FOLDER_PATH}switch-off-night.webm`,
        },
    };

    const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? [APPEARANCE_THEMES.DARK]
        : [APPEARANCE_THEMES.LIGHT];

    const introUrl = appearanceTheme === APPEARANCE_THEMES.SYSTEM
        ? sourcesMap[systemTheme][connectivityState.value].intro
        : sourcesMap[appearanceTheme][connectivityState.value].intro;

    const videoUrl = appearanceTheme === APPEARANCE_THEMES.SYSTEM
        ? sourcesMap[systemTheme][connectivityState.value].video
        : sourcesMap[appearanceTheme][connectivityState.value].video;

    const handleVideoEnded = () => {
        setIntroHidden(true);
    };

    const renderVideo = (introUrl, videoUrl) => {
        const introRef = useRef();
        const videoRef = useRef();

        useEffect(() => {
            setIntroHidden(false);
            introRef.current?.load();
            videoRef.current?.load();
        }, [introUrl, videoUrl]);

        return (
            <>
                <video ref={videoRef} aria-hidden="true" className="settings__video" playsInline autoPlay loop>
                    <source src={videoUrl} type="video/webm" />
                </video>
                <video ref={introRef} aria-hidden="true" className={videoClass} playsInline autoPlay onEnded={handleVideoEnded}>
                    <source src={introUrl} type="video/webm" />
                </video>
            </>
        );
    };

    return (
        <div className={settingsClass}>
            {renderVideo(introUrl, videoUrl)}
            <div className="settings__main">
                <Status />
                <GlobalControl />
            </div>
        </div>
    );
});

export default Settings;
