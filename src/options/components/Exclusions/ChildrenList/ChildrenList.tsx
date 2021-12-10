import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { ChildrenListItem } from './ChildrenListItem';

export const ChildrenList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const exclusions = exclusionsStore.selectedExclusionChildren;

    if (!exclusions) {
        return null;
    }

    return (
        <div className="exclusion-settings">
            <ChildrenListItem
                exclusions={exclusions}
                parentId={null}
            />
        </div>
    );
});
