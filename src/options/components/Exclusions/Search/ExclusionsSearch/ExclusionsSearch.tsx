import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../../background/telemetry';
import { rootStore } from '../../../../stores';
import { translator } from '../../../../../common/translator';
import { Input } from '../../../ui/Input';

export const ExclusionsSearch = observer(() => {
    const { exclusionsStore, telemetryStore } = useContext(rootStore);

    const changeHandler = (value: string) => {
        exclusionsStore.setExclusionsSearchValue(value);
    };

    const clickHandler = () => {
        // FIXME: Waits for clarification
        telemetryStore.sendCustomEvent(
            TelemetryActionName.SearchWebsite,
            TelemetryScreenName.ExclusionsScreen,
        );
    };

    return (
        <div className="exclusions__search">
            <Input
                placeholder={translator.getMessage('settings_exclusion_search_website')}
                value={exclusionsStore.exclusionsSearchValue}
                onChange={changeHandler}
                onClick={clickHandler}
            />
        </div>
    );
});
