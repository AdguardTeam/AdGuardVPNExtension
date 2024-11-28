import React from 'react';

import './loader.pcss';

export function Loader() {
    return (
        <div className="loader">
            <svg className="loader__spinner">
                <use xlinkHref="#spinner" />
            </svg>
        </div>
    );
}
