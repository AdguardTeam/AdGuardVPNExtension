import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { ServiceSettings } from './ServiceSettings';
import { GroupSettings } from './GroupSettings';

export const ExclusionSettings = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const exclusionData = exclusionsStore.exclusionDataToShow;

    const renderSettings = () => {
        if (exclusionData?.serviceId) {
            return (
                <ServiceSettings exclusionData={exclusionData} />
            );
        }

        const parentServiceId = exclusionsStore.isExclusionsGroupInsideService(exclusionData?.id);

        if (parentServiceId) {
            return (
                <GroupSettings
                    exclusionData={exclusionData}
                    parentServiceId={parentServiceId}
                />
            );
        }

        return (
            <GroupSettings
                exclusionData={exclusionData}
                parentServiceId={null}
            />
        );
    };

    return (
        <div className="exclusion-settings">
            {renderSettings()}
        </div>
    );
});
