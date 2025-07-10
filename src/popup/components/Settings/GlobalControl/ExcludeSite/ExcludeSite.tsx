import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { rootStore } from '../../../../stores';
import { useOutsideClick } from '../../../../../common/hooks/useOutsideClick';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { HintPopup } from '../HintPopup/HintPopup';

import './exclude-site.pcss';

export const ExcludeSite = observer(() => {
    const { authStore, settingsStore } = useContext(rootStore);

    const { shouldShowHintPopup, showHintPopup } = authStore;

    const outsideClickRef = useRef<HTMLDivElement>(null);

    useOutsideClick(outsideClickRef, async (): Promise<void> => {
        // If hint popup is opened - close hint and marked hint as viewed on any
        // outside click.
        if (showHintPopup) {
            await authStore.closeHintPopup();
        }
    });

    const disableVpnForCurrentSite = async (): Promise<void> => {
        await settingsStore.disableVpnOnCurrentTab();
        // If a user has excluded a site once - we don't need to show
        // the hint, and we mark the hint as viewed.
        await authStore.closeHintPopup();
    };

    const exclusionButtonClasses = classnames(
        'button button--inline settings__exclusion-btn',
        { 'button--highlighted-hint': shouldShowHintPopup },
    );

    return (
        <div ref={outsideClickRef} className="exclude-site-wrapper">
            <button
                onClick={disableVpnForCurrentSite}
                type="button"
                className={exclusionButtonClasses}
            >
                {reactTranslator.getMessage('popup_settings_disable_vpn')}
            </button>
            {shouldShowHintPopup && <HintPopup />}
        </div>
    );
});
