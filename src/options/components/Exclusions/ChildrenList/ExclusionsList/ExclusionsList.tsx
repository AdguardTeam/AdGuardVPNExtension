import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../../../stores';
import { ExclusionDtoInterface, ExclusionsTypes } from '../../../../../common/exclusionsConstants';
import { SubdomainModal } from '../SubdomainModal';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { ChildrenListItem } from '../ChildrenListItem';

import './exclusions-list.pcss';

export const ExclusionsList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);
    const { selectedExclusion } = exclusionsStore;

    const resetServiceData = async () => {
        // TODO reset service data
    };

    const onAddSubdomainClick = () => {
        exclusionsStore.openAddSubdomainModal();
    };

    const resetButtonClass = classnames(
        'button',
        'button--medium',
        'button--outline-gray',
        'exclusions-list__reset',
        { hidden: selectedExclusion.type !== ExclusionsTypes.Service },
    );

    const addSubdomainButtonClass = classnames(
        'exclusions-list__add-subdomain',
        'simple-button',
        { hidden: selectedExclusion.type !== ExclusionsTypes.Group },
    );

    return (
        <div className="exclusions-list">
            {
                selectedExclusion.children.map((exclusion: ExclusionDtoInterface) => {
                    return <ChildrenListItem exclusion={exclusion} key={exclusion.id} />;
                })
            }
            <button
                type="button"
                className={resetButtonClass}
                onClick={resetServiceData}
            >
                {reactTranslator.getMessage('settings_exclusion_reset_to_default')}
            </button>
            <button
                type="button"
                className={addSubdomainButtonClass}
                onClick={onAddSubdomainClick}
            >
                {reactTranslator.getMessage('settings_exclusion_add_subdomain')}
            </button>
            <SubdomainModal />
        </div>
    );
});
