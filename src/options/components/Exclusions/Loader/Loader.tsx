import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { rootStore } from '../../../stores';

import './loader.pcss';

export const Loader = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const loaderClass = classnames('loader', {
        loader__visible: exclusionsStore.importingExclusions,
    });

    return (
        <div className={loaderClass}>
            <svg className="loader__spinner">
                <use xlinkHref="#spinner" />
            </svg>
        </div>
    );
});
