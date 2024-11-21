import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { Title } from '../ui/Title';

import { QuickConnect } from './QuickConnect';
import { AppearanceTheme } from './AppearanceTheme';

export const General = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { showDnsSettings } = settingsStore;

    if (showDnsSettings) {
        return (
            <>DNS Settings</>
        );
    }

    return (
        <>
            {/* FIXME: Translation */}
            <Title title="General" />
            <QuickConnect />
            <AppearanceTheme />
        </>
    );
});
