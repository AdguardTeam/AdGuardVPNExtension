import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../../../../stores';
import { ServicesSearch } from '../../../Search';
import { translator } from '../../../../../../common/translator';

import { ServicesList } from './ServicesList';

import './service-mode.pcss';

export const SERVICE_FORM_ID = 'add-exclusion-form-service';

/**
 * Service mode component.
 */
/**
 * ServiceMode component props.
 */
interface ServiceModeProps {
    /**
     * Whether the component is rendered inside a profile context.
     */
    isProfileContext: boolean;
}

export const ServiceMode = observer(({ isProfileContext }: ServiceModeProps) => {
    const { exclusionsStore, notificationsStore, telemetryStore } = useContext(rootStore);

    const closeModal = (): void => {
        exclusionsStore.closeAddExclusionModal();
    };

    const handleSaveServices = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        telemetryStore.sendCustomEvent(
            TelemetryActionName.SaveWebsiteClick,
            TelemetryScreenName.DialogAddWebsiteExclusion,
        );

        const toggleServicesResult = await exclusionsStore.toggleServices();
        const { added, deleted } = toggleServicesResult;

        const addedExclusionsMessage = added
            ? translator.getMessage('options_exclusions_added_exclusions', { count: added })
            : '';

        const deletedExclusionsMessage = deleted
            ? translator.getMessage('options_exclusions_deleted_exclusions', { count: deleted })
            : '';

        notificationsStore.notifySuccess(
            `${addedExclusionsMessage} ${deletedExclusionsMessage}`,
            {
                action: translator.getMessage('settings_exclusions_undo'),
                handler: exclusionsStore.restoreExclusions,
            },
        );

        closeModal();
    };

    return (
        <form
            id={SERVICE_FORM_ID}
            className="service-mode"
            onSubmit={handleSaveServices}
        >
            <ServicesSearch isProfileContext={isProfileContext} />
            <ServicesList isProfileContext={isProfileContext} />
        </form>
    );
});
