import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';
import { type ExclusionDtoInterface } from '../../../../common/exclusionsConstants';
import { Loader } from '../Loader';
import { Exclusion } from '../Exclusion';

export const List = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    if (exclusionsStore.exclusionsSearchValue && !exclusionsStore.preparedExclusions.length) {
        return (
            <div className="exclusions__empty">
                {translator.getMessage('settings_exclusion_nothing_found')}
            </div>
        );
    }

    return (
        <div className="loader__container">
            {exclusionsStore.preparedExclusions.map((exclusion: ExclusionDtoInterface) => (
                <Exclusion
                    key={exclusion.id}
                    exclusion={exclusion}
                    hasIcon
                />
            ))}
            <Loader />
        </div>
    );
});
