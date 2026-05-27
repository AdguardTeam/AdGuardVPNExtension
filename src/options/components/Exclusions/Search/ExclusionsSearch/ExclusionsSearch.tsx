import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../../../stores';
import { translator } from '../../../../../common/translator';
import { Input } from '../../../ui/Input';

/**
 * ExclusionsSearch component props.
 */
interface ExclusionsSearchProps {
    /**
     * Whether the component is rendered inside a profile context.
     */
    isProfileContext: boolean;
}

export const ExclusionsSearch = observer(({ isProfileContext }: ExclusionsSearchProps) => {
    const { exclusionsStore, telemetryStore } = useContext(rootStore);
    const isTelemetrySent = useRef(false);

    const changeHandler = (value: string): void => {
        // Telemetry event should be sent only once
        // when user starts typing in the search field.
        // NOTE: State will be reset when this component is unmounted.
        if (!isTelemetrySent.current) {
            isTelemetrySent.current = true;
            telemetryStore.sendCustomEvent(
                isProfileContext ? TelemetryActionName.ProfileSearchWebsite : TelemetryActionName.SearchWebsite,
                isProfileContext ? TelemetryScreenName.ProfileExclusionScreen : TelemetryScreenName.ExclusionsScreen,
            );
        }

        exclusionsStore.setExclusionsSearchValue(value);
    };

    return (
        <div className="exclusions__search">
            <Input
                placeholder={translator.getMessage('settings_exclusion_search_website')}
                value={exclusionsStore.exclusionsSearchValue}
                onChange={changeHandler}
            />
        </div>
    );
});
