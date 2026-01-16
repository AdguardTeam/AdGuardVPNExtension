import React, { useContext, type ReactElement } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';

import { BackgroundAnimationFF } from './BackgroundAnimationFF';
import { BackgroundAnimationCommon } from './BackgroundAnimationCommon';

export const BackgroundAnimation = observer((): ReactElement | null => {
    const { settingsStore } = useContext(rootStore);

    if (settingsStore.isFirefox === null) {
        return null;
    }

    /**
     * Use Firefox specific implementation to work around drawImage bug
     * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1526207
     */
    if (settingsStore.isFirefox) {
        return <BackgroundAnimationFF />;
    }

    return <BackgroundAnimationCommon />;
});
