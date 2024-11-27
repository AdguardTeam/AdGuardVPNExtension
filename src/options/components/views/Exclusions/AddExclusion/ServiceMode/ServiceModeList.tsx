import React, { type PropsWithChildren } from 'react';

import { reactTranslator } from '../../../../../../common/reactTranslator';

export interface ServiceModeListProps extends PropsWithChildren {
    empty: boolean;
    searchEmpty: boolean;
}

export function ServiceModeList({
    empty,
    searchEmpty,
    children,
}: ServiceModeListProps) {
    let content;
    if (searchEmpty) {
        content = (
            <div className="service-mode-list__empty">
                {reactTranslator.getMessage('settings_exclusion_nothing_found')}
            </div>
        );
    } else if (empty) {
        content = (
            <div className="service-mode-list__empty">
                {reactTranslator.getMessage('settings_exclusion_connection_problem')}
            </div>
        );
    } else {
        content = (
            <div className="service-mode-list">
                {children}
            </div>
        );
    }

    return (
        <div className="service-mode__content">
            {content}
        </div>
    );
}
