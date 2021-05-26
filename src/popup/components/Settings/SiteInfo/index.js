import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import Info from './Info';
import { reactTranslator } from '../../../../common/reactTranslator';

import './site-info.pcss';

const SiteInfo = observer(() => {
    const { settingsStore } = useContext(rootStore);

    if (settingsStore.displayNonRoutable) {
        return (
            <Info
                title={settingsStore.currentTabHostname}
                status={reactTranslator.getMessage('popup_site_status_unaccessible')}
            />
        );
    }

    return (
        <Info
            title={settingsStore.currentTabHostname}
            status={reactTranslator.getMessage('popup_site_status_vpn_disabled')}
        />
    );
});

export default SiteInfo;
