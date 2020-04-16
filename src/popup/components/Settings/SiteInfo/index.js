import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import rootStore from '../../../stores';
import Info from './Info';
import StatusImage from '../StatusImage';

import './site-info.pcss';

// TODO translations
const SiteInfo = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { canBeExcluded } = settingsStore;

    const addToExclusions = async () => {
        await settingsStore.addToExclusions();
    };

    const removeFromExclusions = async () => {
        await settingsStore.removeFromExclusions();
    };

    if (settingsStore.displayNonRoutable) {
        const nonRoutableActionsMap = {
            regular: (
                <div className="site-info__wrap">
                    <span className="site-info__desc">You can&nbsp;</span>
                    <a
                        type="button"
                        className="button site-info__link"
                        onClick={addToExclusions}
                    >
                        add the website to exclusions
                    </a>
                </div>
            ),
            selective: (
                <div className="site-info__wrap">
                    <span className="site-info__desc">You can&nbsp;</span>
                    <a
                        type="button"
                        className="button site-info__link"
                        onClick={removeFromExclusions}
                    >
                        disable VPN on this website
                    </a>
                </div>
            ),
        };

        const actionRender = settingsStore.exclusionsInverted
            ? nonRoutableActionsMap.selective
            : nonRoutableActionsMap.regular;

        return (
            <Info
                title={settingsStore.currentTabHostname}
                status="is located in your local network and unaccessible via VPN"
            >
                {actionRender}
            </Info>
        );
    }

    if (!settingsStore.isExcluded && settingsStore.exclusionsInverted && canBeExcluded) {
        return (
            <Info
                title={settingsStore.currentTabHostname}
                status="VPN is disabled on this website"
            >
                <div className="site-info__wrap">
                    <span className="site-info__desc">You can&nbsp;</span>
                    <a
                        type="button"
                        className="button site-info__link"
                        onClick={addToExclusions}
                    >
                        enable VPN on this website
                    </a>
                </div>
            </Info>
        );
    }

    if (settingsStore.isExcluded && !settingsStore.exclusionsInverted) {
        return (
            <Info
                title={settingsStore.currentTabHostname}
                status="added to exclusions"
            >
                <div className="site-info__wrap">
                    <span className="site-info__desc">You can&nbsp;</span>
                    <a
                        type="button"
                        className="button site-info__link"
                        onClick={removeFromExclusions}
                    >
                        enable VPN on this website
                    </a>
                </div>
            </Info>
        );
    }

    return <StatusImage enabled={settingsStore.displayEnabled} />;
});

export default SiteInfo;
