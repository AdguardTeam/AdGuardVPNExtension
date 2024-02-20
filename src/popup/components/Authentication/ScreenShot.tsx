import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { AppearanceTheme } from '../../../common/constants';

export const ScreenShot = observer(() => {
    const { authStore, settingsStore } = useContext(rootStore);
    const { handleScreenshotClick } = authStore;
    const { systemTheme } = settingsStore;

    const imageSource = systemTheme === AppearanceTheme.Dark
        ? '../../../assets/images/screenshot_dark.svg'
        : '../../../assets/images/screenshot.svg';

    return (
        <img
            src={imageSource}
            className="auth__screenshot"
            alt="screenshot"
            onClick={handleScreenshotClick}
        />
    );
});
