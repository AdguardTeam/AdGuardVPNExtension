import React, { useContext } from 'react';
import { observer } from 'mobx-react';

// import { TYPE } from '../../../../common/exclusionsConstants';
import { rootStore } from '../../../../stores';
import { Title } from '../../../ui/Title';
import { StateBox } from '../../StateBox';
import { TYPE } from '../../../../../common/exclusionsConstants';

import './service-settings.pcss';

// FIXME remove @ts-ignore
// @ts-ignore
export const ServiceSettings = observer(({ exclusionData }) => {
    const { exclusionsStore } = useContext(rootStore);

    const goBack = () => {
        exclusionsStore.setExclusionIdToShowSettings(null);
    };

    const showGroupSettings = (id: string) => () => {
        exclusionsStore.setExclusionIdToShowSettings(id);
    };

    // eslint-disable-next-line no-unused-vars
    const toggleState = (subdomainId: string) => () => {
        // ...
    };

    // FIXME remove any
    const renderedExclusionsGroups = exclusionData.exclusionsGroups.map((group: any) => {
        return (
            <div
                className="service__settings__group"
                key={group.hostname}
            >
                <StateBox
                    id={group.id}
                    type={TYPE.GROUP}
                    state={group.state}
                    toggleHandler={toggleState}
                />
                <div
                    className="service__settings__group__hostname"
                    onClick={showGroupSettings(group.id)}
                >
                    {group.hostname}
                </div>
                <button
                    type="button"
                    className="service__settings__group__remove-button"
                    // onClick={}
                >
                    <svg className="service__settings__group__remove-button__icon">
                        <use xlinkHref="#basket" />
                    </svg>
                </button>
            </div>
        );
    });

    return (
        <div className="service">
            <div className="service__title">
                <button className="service__back-button back-button" type="button" onClick={goBack}>
                    <svg className="icon icon--button">
                        <use xlinkHref="#arrow" />
                    </svg>
                </button>
                <Title
                    title={exclusionData.serviceName}
                    subtitle="AdGuard VPN is off for the checked domains"
                />
            </div>
            <div className="service__settings">
                {renderedExclusionsGroups}
            </div>
        </div>
    );
});
