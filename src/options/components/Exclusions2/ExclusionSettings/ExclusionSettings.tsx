import React, { useContext } from 'react';
import { observer } from 'mobx-react';

// import { TYPE } from '../../../../common/exclusionsConstants';
import { rootStore } from '../../../stores';
import { ServiceSettings } from './ServiceSettings';
import { GroupSettings } from './GroupSettings';

export const ExclusionSettings = observer(() => {
    const { exclusionsStore } = useContext(rootStore);
    const { exclusionIdToShowSettings } = exclusionsStore;

    const exclusionData = exclusionsStore.getExclusionById(exclusionIdToShowSettings);

    return (
        <div className="exclusion-settings">
            {
                exclusionData.serviceId
                    ? <ServiceSettings exclusionData={exclusionData} />
                    : <GroupSettings exclusionData={exclusionData} />
            }
        </div>
    );
});
