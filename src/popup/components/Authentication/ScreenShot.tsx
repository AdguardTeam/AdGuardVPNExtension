import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { HeaderScreenShot } from '../Header';
import { CurrentEndpointScreenShot } from '../Settings/CurrentEndpoint';
import { SettingsScreenShot } from '../Settings';

/**
 * Component is a step of the Authentication flow.
 * It acts as a big "Call to Action" button, which on click anywhere
 * will trigger Login/Signup flow. It renders the main content
 * of Popup page as a static non-interactive screenshot.
 * The main reason why static elements are used instead of actual
 * screenshot image is ability to adapt to different screen sizes.
 */
export const ScreenShot = observer(() => {
    const { authStore } = useContext(rootStore);
    const { handleScreenshotClick } = authStore;

    const onClickHandler = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        handleScreenshotClick();
    };

    return (
        <div
            className="auth__screenshot content"
            onClickCapture={onClickHandler}
        >
            <HeaderScreenShot />
            <SettingsScreenShot />
            <div className="footer">
                {/* We are assigning manually because at this stage we don't have list of servers */}
                <CurrentEndpointScreenShot
                    countryCode="DE"
                    countryName="Germany"
                    cityName="Berlin"
                />
            </div>
        </div>
    );
});
