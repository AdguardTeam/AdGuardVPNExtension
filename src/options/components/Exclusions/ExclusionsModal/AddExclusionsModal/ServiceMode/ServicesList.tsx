import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../../stores';
import { translator } from '../../../../../../common/translator';

import { ServiceCategory } from './ServiceCategory';

/**
 * ServicesList component props.
 */
interface ServicesListProps {
    /**
     * Whether the component is rendered inside a profile context.
     */
    isProfileContext: boolean;
}

export const ServicesList = observer(({ isProfileContext }: ServicesListProps) => {
    const { exclusionsStore } = useContext(rootStore);

    const { categories } = exclusionsStore.preparedServicesData;

    let content: React.ReactNode;
    if (!Object.keys(categories).length) {
        content = (
            <div className="service-mode-list__empty">
                {translator.getMessage('settings_exclusion_connection_problem')}
            </div>
        );
    } else if (exclusionsStore.isServicesSearchEmpty) {
        content = (
            <div className="service-mode-list__empty">
                {translator.getMessage('settings_exclusion_nothing_found')}
            </div>
        );
    } else {
        content = (
            <div className="service-mode-list">
                {Object.values(categories).map((category) => {
                    return (
                        <ServiceCategory
                            key={category.id}
                            category={category}
                            isProfileContext={isProfileContext}
                        />
                    );
                })}
            </div>
        );
    }

    return (
        <div className="service-mode__content">
            {content}
        </div>
    );
});
