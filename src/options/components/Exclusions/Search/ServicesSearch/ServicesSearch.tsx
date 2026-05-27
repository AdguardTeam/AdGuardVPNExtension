import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../../../stores';
import { translator } from '../../../../../common/translator';
import { Input } from '../../../ui/Input';

/**
 * ServicesSearch component props.
 */
interface ServicesSearchProps {
    /**
     * Whether the component is rendered inside a profile context.
     */
    isProfileContext: boolean;
}

export const ServicesSearch = observer(({ isProfileContext }: ServicesSearchProps) => {
    const { exclusionsStore, telemetryStore } = useContext(rootStore);
    const isTelemetrySent = useRef(false);

    const changeHandler = (value: string): void => {
        // Telemetry event should be sent only once
        // when user starts typing in the search field.
        // NOTE: State will be reset when this component is unmounted.
        if (!isTelemetrySent.current) {
            isTelemetrySent.current = true;
            telemetryStore.sendCustomEvent(
                isProfileContext ? TelemetryActionName.ProfileSearchFromList : TelemetryActionName.SearchFromList,
                isProfileContext
                    ? TelemetryScreenName.ProfileDialogAddWebsiteExclusion
                    : TelemetryScreenName.DialogAddWebsiteExclusion,
            );
        }

        exclusionsStore.setServicesSearchValue(value);
    };

    return (
        <div className="exclusions__search exclusions__search--services">
            <Input
                placeholder={translator.getMessage('settings_exclusion_placeholder_search')}
                value={exclusionsStore.servicesSearchValue}
                onChange={changeHandler}
            />
        </div>
    );
});
