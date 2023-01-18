import punycode from 'punycode';

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { Info } from './Info';
import { reactTranslator } from '../../../../common/reactTranslator';

import './site-info.pcss';

export const SiteInfo = observer(() => {
    const { settingsStore } = useContext(rootStore);

    if (settingsStore.displayNonRoutable) {
        return (
            <Info
                title={punycode.toUnicode(settingsStore.currentTabHostname)}
                status={reactTranslator.getMessage('popup_site_status_unaccessible')}
            />
        );
    }

    return (
        <Info
            title={punycode.toUnicode(settingsStore.currentTabHostname)}
            status={reactTranslator.getMessage('popup_site_status_vpn_disabled')}
        />
    );
});
