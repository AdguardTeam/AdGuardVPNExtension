import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import rootStore from '../../../stores';

import StatusImage from '../StatusImage';
import Status from '../Status';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import SiteInfo from '../SiteInfo';

const ExclusionsDisable = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const removeFromExclusions = async () => {
        await settingsStore.removeFromExclusions();
    };

    const addToExclusions = async () => {
        await settingsStore.addToExclusions();
    };

    const buttonsInfo = {
        add: addToExclusions,
        remove: removeFromExclusions,
    };

    const button = settingsStore.isExcluded ? buttonsInfo.remove : buttonsInfo.add;

    return (
        <div className="settings settings--exclusions-disable">
            <div className="settings__main">
                <>
                    <StatusImage />
                    <Status />
                    { !settingsStore.displayNonRoutable && (
                        <button
                            onClick={button}
                            type="button"
                            className="button button--medium button--green"
                        >
                            {reactTranslator.translate('popup_settings_enable_vpn_shot')}
                        </button>
                    )}
                    <SiteInfo
                        title={settingsStore.currentTabHostname}
                        status={reactTranslator.translate('popup_site_status_vpn_disabled')}
                    />
                </>
            </div>
        </div>
    );
});

export default ExclusionsDisable;
