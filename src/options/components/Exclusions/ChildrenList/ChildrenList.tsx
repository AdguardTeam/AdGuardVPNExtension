import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { translator } from '../../../../common/translator';
import { ListItem } from '../List/ListItem';
import { ExclusionDtoInterface } from '../../../../common/exclusionsConstants';

export const ChildrenList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const exclusions = exclusionsStore.selectedExclusionChildren;

    if (exclusions.length === 0) {
        return null;
    }

    return (
        <>
            {/* FIXME add back button and actual titles */}
            <Title
                title={translator.getMessage('settings_exclusion_title')}
                subtitle={translator.getMessage('settings_exclusion_select_mode')}
            />
            <div className="settings">
                {
                    exclusionsStore.selectedExclusionChildren
                        .map((exclusion: ExclusionDtoInterface) => {
                            return (<ListItem exclusion={exclusion} key={exclusion.id} />);
                        })
                }
            </div>
        </>
    );
});
