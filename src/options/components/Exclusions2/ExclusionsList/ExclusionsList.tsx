import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';

import './exclusions-list.pcss';

export const ExclusionsList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);
    const { currentMode } = exclusionsStore;

    const excludedIps = exclusionsStore.getExcludedIpsList(currentMode);
    const excludedGroups = exclusionsStore.getExclusionsGroupsList(currentMode);
    const excludedServices = exclusionsStore.getExcludedServicesList(currentMode);

    const exclusionsList = [...excludedIps, ...excludedGroups, ...excludedServices]
        .map((exclusion) => {
            return (
                <li key={exclusion}>{exclusion}</li>
            );
        });

    return (
        <div className="exclusions-list">
            <ul>
                {exclusionsList}
            </ul>
        </div>
    );
});
