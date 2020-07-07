import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import rootStore from '../../../stores';
import Info from './Info';
import StatusImage from '../StatusImage';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

import './site-info.pcss';

const SiteInfo = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { canBeExcluded } = settingsStore;

    const addToExclusions = async () => {
        await settingsStore.addToExclusions();
    };

    const removeFromExclusions = async () => {
        await settingsStore.removeFromExclusions();
    };

    if (settingsStore.isDisconnectedRetrying || settingsStore.isConnectingRetrying) {
        return <StatusImage />;
    }

    if (settingsStore.displayNonRoutable) {
        const nonRoutableActionsMap = {
            regular: (
                <div className="site-info__wrap">
                    {reactTranslator.translate('popup_exclusions_add_site_to_exclusions', {
                        span: (chunks) => (<span className="site-info__desc">{chunks}</span>),
                        a: (chunks) => (
                            <a
                                type="button"
                                className="button site-info__link"
                                onClick={addToExclusions}
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                </div>
            ),
            selective: (
                <div className="site-info__wrap">
                    {reactTranslator.translate('popup_exclusions_disable_vpn_on_site', {
                        span: (chunks) => (<span className="site-info__desc">{chunks}</span>),
                        a: (chunks) => (
                            <a
                                type="button"
                                className="button site-info__link"
                                onClick={removeFromExclusions}
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                </div>
            ),
        };

        const actionRender = settingsStore.exclusionsInverted
            ? nonRoutableActionsMap.selective
            : nonRoutableActionsMap.regular;

        return (
            <Info
                title={settingsStore.currentTabHostname}
                status={reactTranslator.translate('popup_site_status_unaccessible')}
            >
                {actionRender}
            </Info>
        );
    }

    if (!settingsStore.isExcluded && settingsStore.exclusionsInverted && canBeExcluded) {
        return (
            <Info
                title={settingsStore.currentTabHostname}
                status={reactTranslator.translate('popup_site_status_vpn_disabled')}
            >
                <div className="site-info__wrap">
                    {reactTranslator.translate('popup_exclusions_enable_vpn_on_site', {
                        span: (chunks) => (<span className="site-info__desc">{chunks}</span>),
                        a: (chunks) => (
                            <a
                                type="button"
                                className="button site-info__link"
                                onClick={addToExclusions}
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                </div>
            </Info>
        );
    }

    if (settingsStore.isExcluded && !settingsStore.exclusionsInverted) {
        return (
            <Info
                title={settingsStore.currentTabHostname}
                status={reactTranslator.translate('popup_site_status_added_to_exclusions')}
            >
                <div className="site-info__wrap">
                    {reactTranslator.translate('popup_exclusions_enable_vpn_on_site', {
                        span: (chunks) => (<span className="site-info__desc">{chunks}</span>),
                        a: (chunks) => (
                            <a
                                type="button"
                                className="button site-info__link"
                                onClick={removeFromExclusions}
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                </div>
            </Info>
        );
    }

    return <StatusImage />;
});

export default SiteInfo;
