import React from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translator';
import { Title } from '../../ui/Title';

import { Actions, ActionsRemoveAllModal } from './Actions';
import { ModeSelectorButton, ModeSelectorModal, ModeSelectorWarning } from './ModeSelector';

import './exclusions.pcss';

export const Exclusions = observer(() => {
    return (
        <>
            <Title
                title={translator.getMessage('settings_exclusion_title')}
                action={<Actions />}
                description={(
                    <div className="exclusions__description">
                        <ModeSelectorButton />
                        <ModeSelectorWarning />
                        <div className="exclusions__description-search">
                            Search
                        </div>
                    </div>
                )}
            />
            <ActionsRemoveAllModal />
            <ModeSelectorModal />
        </>
    );
});
