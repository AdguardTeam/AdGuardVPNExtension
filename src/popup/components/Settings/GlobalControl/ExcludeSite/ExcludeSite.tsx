import React, { useContext, useRef } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { useOutsideClick } from '../../../../../common/components/ui/useOutsideClick';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { HintPopup } from '../HintPopup/HintPopup';

import './exclude-site.pcss';

export const ExcludeSite = observer(() => {
    const { authStore, settingsStore } = useContext(rootStore);

    const { shouldShowHintPopup } = authStore;

    const outsideClickRef = useRef<HTMLDivElement>(null);

    useOutsideClick(outsideClickRef, async (): Promise<void> => {
        await authStore.closeHintPopup();
    });

    const disableVpnForCurrentSite = async (): Promise<void> => {
        await authStore.closeHintPopup();
        await settingsStore.disableVpnOnCurrentTab();
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
