import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';

import { Actions } from './Actions';
import { ModeSelector } from './ModeSelector';
import { Search } from './Search';
import { ChildrenList } from './ChildrenList';
import { RootList } from './RootList';
import { AddExclusion } from './AddExclusion';

import './exclusions.pcss';

export const Exclusions = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    if (exclusionsStore.selectedExclusion) {
        return <ChildrenList />;
    }

    return (
        <>
            <Title
                title={reactTranslator.getMessage('settings_exclusion_title')}
                action={<Actions />}
                description={(
                    <>
                        <ModeSelector />
                        <Search />
                    </>
                )}
            />
            <RootList />
            <AddExclusion />
        </>
    );
});
