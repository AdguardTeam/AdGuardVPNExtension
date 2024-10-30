import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { type ExclusionDtoInterface } from '../../../../common/exclusionsConstants';
import { Loader } from '../Loader';

import { ListItem } from './ListItem';

export const List = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    if (exclusionsStore.exclusionsSearchValue && !exclusionsStore.preparedExclusions.length) {
        return (
            <div className="search__nothing-found">
                {reactTranslator.getMessage('settings_exclusion_nothing_found')}
            </div>
        );
    }

    return (
        <div className="loader__container">
            <ul>
                {
                    exclusionsStore.preparedExclusions.map((exclusion: ExclusionDtoInterface) => (
                        <ListItem exclusion={exclusion} key={exclusion.id} />
                    ))
                }
            </ul>
            <Loader />
        </div>
    );
});
