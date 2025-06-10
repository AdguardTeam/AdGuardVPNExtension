import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { Icon } from '../../../../common/components/Icons';

import './loader.pcss';

export const Loader = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const loaderClass = classnames('loader', {
        loader__visible: exclusionsStore.importingExclusions,
    });

    return (
        <div className={loaderClass}>
            <div className="loader__overlay" />
            <Icon
                name="spinner"
                size="30"
                color="product"
                className="loader__spinner"
            />
        </div>
    );
});
