import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { rootStore } from '../../stores';
import { AnimationState } from '../../constants';
import { translator } from '../../../common/translator';

import { GlobalControl } from './GlobalControl';
import { Status } from './Status';
import { BackgroundAnimation } from './BackgroundAnimation';

import './settings.pcss';

export const Settings = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const { isConnected } = settingsStore;
    const { premiumPromoEnabled, isPremiumToken } = vpnStore;

    const settingsClass = classnames(
        'settings',
        { 'settings--active': isConnected },
        { 'settings--premium-promo': premiumPromoEnabled },
        { 'settings--trial': !isPremiumToken },
        { 'settings--feedback': !premiumPromoEnabled },
    );

    return (
        <div className={settingsClass}>
            <BackgroundAnimation />
            <div className="settings__animation-overlay" />
            <div className="settings__main">
                <Status />
                <GlobalControl />
            </div>
        </div>
    );
});

/**
 * Component is used as part of the ScreenShot component
 * to render the Settings as static non-interactive element.
 *
 * See `ScreenShot.tsx` for more details.
 */
export const SettingsScreenShot = () => (
    <div className="settings">
        <BackgroundAnimation
            overrideAnimationState={AnimationState.VpnDisabled}
        />
        <div className="settings__animation-overlay" />
        <div className="settings__main">
            {/* Status */}
            <div className="status">
                {translator.getMessage('settings_vpn_disabled')}
            </div>

            {/* GlobalControl */}
            <button type="button" className="button button--medium button--main button--green">
                {translator.getMessage('settings_connect')}
            </button>

            {/* GlobalControl -> ExcludeSite */}
            <div className="exclude-site-wrapper">
                <button type="button" className="button button--inline settings__exclusion-btn">
                    {translator.getMessage('popup_settings_disable_vpn')}
                </button>
            </div>
        </div>
    </div>
);
