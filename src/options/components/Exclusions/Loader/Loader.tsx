import React from 'react';

import { Icon } from '../../ui/Icon';

import './loader.pcss';

export function Loader() {
    return (
        <div className="loader">
            <Icon name="spinner" className="loader__spinner" />
        </div>
    );
}
