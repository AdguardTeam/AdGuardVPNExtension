import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { ServiceSettings } from './ServiceSettings';
import { GroupSettings } from './GroupSettings';
import { Service } from '../../../../background/exclusions/services/Service';
import { ExclusionsGroup } from '../../../../background/exclusions/exclusions/ExclusionsGroup';

export const ExclusionSettings = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const exclusionData = exclusionsStore.exclusionDataToShow;

    if (!exclusionData) {
        return null;
    }

    const renderSettings = () => {
        // FIXME: figure out how to avoid type casting
        if ((exclusionData as Service).serviceId) {
            return (
                <ServiceSettings exclusionData={exclusionData as Service} />
            );
        }

        const parentServiceId = exclusionsStore.isExclusionsGroupInsideService(
            // FIXME: figure out how to avoid type casting
            (exclusionData as ExclusionsGroup).id,
        );

        if (parentServiceId) {
            return (
                <GroupSettings
                    exclusionData={exclusionData as ExclusionsGroup}
                    parentServiceId={parentServiceId}
                />
            );
        }

        return (
            <GroupSettings
                exclusionData={exclusionData as ExclusionsGroup}
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
