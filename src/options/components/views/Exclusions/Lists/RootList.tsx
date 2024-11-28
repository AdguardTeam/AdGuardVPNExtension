import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { Exclusion } from '../Exclusion';
import { Loader } from '../Loader';

export const RootList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    if (exclusionsStore.exclusionsSearchValue && !exclusionsStore.preparedExclusions.length) {
        return (
            <div className="exclusions__empty">
                {reactTranslator.getMessage('settings_exclusion_nothing_found')}
            </div>
        );
    }

    return (
        <>
            {exclusionsStore.preparedExclusions.map((exclusion) => (
                <Exclusion
                    key={exclusion.id}
                    exclusion={exclusion}
                    hasIcon
                />
            ))}
            {exclusionsStore.importingExclusions && (
                <Loader />
            )}
        </>
    );
});
