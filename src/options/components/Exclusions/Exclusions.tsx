import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { translator } from '../../../common/translator';

import { ModeSelector, ModeSelectorModal } from './ModeSelector';
import { Actions } from './Actions';
import { ChildrenList } from './ChildrenList';
import { ExclusionsSearch } from './Search';

import './exclusions.pcss';

export const Exclusions = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    if (exclusionsStore.selectedExclusion) {
        return (
            <ChildrenList />
        );
    }

    return (
        <>
            <Title
                title={translator.getMessage('settings_exclusion_title')}
                subtitle={(
                    <>
                        <ModeSelector />
                        <ExclusionsSearch />
                    </>
                )}
                action={<Actions />}
            />
            <ModeSelectorModal />
        </>
    );
});
