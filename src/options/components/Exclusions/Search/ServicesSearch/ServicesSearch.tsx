import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../../background/telemetry';
import { rootStore } from '../../../../stores';
import { translator } from '../../../../../common/translator';
import { Input } from '../../../ui/Input';

export const ServicesSearch = observer(() => {
    const { exclusionsStore, telemetryStore } = useContext(rootStore);

    const changeHandler = (value: string) => {
        exclusionsStore.setServicesSearchValue(value);
    };

    const clickHandler = () => {
        // FIXME: Waits for clarification
        telemetryStore.sendCustomEvent(
            TelemetryActionName.SearchFromList,
            TelemetryScreenName.DialogAddWebsiteExclusion,
        );
    };

    return (
        <div className="exclusions__search exclusions__search--services">
            <Input
                placeholder={translator.getMessage('settings_exclusion_placeholder_search')}
                value={exclusionsStore.servicesSearchValue}
                onChange={changeHandler}
                onClick={clickHandler}
            />
        </div>
    );
});
