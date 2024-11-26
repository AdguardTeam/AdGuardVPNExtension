import React from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { Title } from '../../ui/Title';

import { Actions } from './Actions';
import { ModeSelector } from './ModeSelector';
import { AddExclusion } from './AddExclusion';

import './exclusions.pcss';

export const Exclusions = observer(() => {
    return (
        <>
            <Title
                title={reactTranslator.getMessage('settings_exclusion_title')}
                action={<Actions />}
                description={(
                    <div className="exclusions__description">
                        <ModeSelector />
                        <div className="exclusions__description-search">
                            Search
                        </div>
                    </div>
                )}
            />
            <AddExclusion />
        </>
    );
});
