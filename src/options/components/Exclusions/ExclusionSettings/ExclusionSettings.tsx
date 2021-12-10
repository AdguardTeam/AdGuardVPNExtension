import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
// import { ServiceSettings } from './ServiceSettings';
import { GroupSettings } from './GroupSettings';
// import { Service } from '../../../../background/exclusions/services/Service';
// import { ExclusionsGroup } from '../../../../background/exclusions/exclusions/ExclusionsGroup';

export const ExclusionSettings = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const exclusions = exclusionsStore.selectedExclusionChildren;

    if (!exclusions) {
        return null;
    }

    // const renderSettings = () => {
    //     // FIXME: figure out how to avoid type casting
    //     if ((exclusions as Service).serviceId) {
    //         return (
    //             <ServiceSettings exclusions={exclusions as Service} />
    //         );
    //     }
    //
    //     const parentId = exclusionsStore.isExclusionsGroupInsideService(
    //         // FIXME: figure out how to avoid type casting
    //         (exclusions as ExclusionsGroup).id,
    //     );
    //
    //     if (parentId) {
    //         return (
    //             <GroupSettings
    //                 exclusions={exclusions}
    //                 parentId={parentId}
    //             />
    //         );
    //     }
    //
    //     return (
    //         <GroupSettings
    //             exclusions={exclusions}
    //             parentId={null}
    //         />
    //     );
    // };

    return (
        <div className="exclusion-settings">
            <GroupSettings
                exclusions={exclusions}
                parentId={null}
            />
        </div>
    );
});
