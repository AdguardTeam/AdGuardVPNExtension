import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { translator } from '../../../../common/translator';
import { getPrivacyAndEulaUrls } from '../../../../common/forwarderHelpers';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { rootStore } from '../../../stores';
import { IconButton } from '../../../../common/components/Icons';

import { StatsScreenModal } from './StatsScreenModal';

/**
 * Component that renders the "Info" modal explaining why stats collection is safe.
 */
export const StatsInfoScreen = observer(() => {
    const { telemetryStore, settingsStore, statsStore } = useContext(rootStore);

    const { forwarderDomain } = settingsStore;
    const { privacyUrl } = getPrivacyAndEulaUrls(forwarderDomain);
    const { isStatsInfoModalOpen, setIsStatsInfoModalOpen } = statsStore;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.InfoScreen,
        isStatsInfoModalOpen,
    );

    const handlePrivacyPolicyClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.StatsPrivacyClick,
            TelemetryScreenName.InfoScreen,
        );
    };

    const openStatsInfoModal = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.InfoClick,
            TelemetryScreenName.SettingsStatsScreen,
        );
        setIsStatsInfoModalOpen(true);
    };

    const closeStatsInfoModal = (): void => {
        setIsStatsInfoModalOpen(false);
    };

    return (
        <>
            <IconButton
                name="info"
                className="stats-screen__info-btn"
                onClick={openStatsInfoModal}
            />
            <StatsScreenModal
                isOpen={isStatsInfoModalOpen}
                title={translator.getMessage('popup_stats_menu_why_safe_title')}
                className="stats-screen-modal-why-safe"
                description={(
                    <>
                        <p>{translator.getMessage('popup_stats_menu_why_safe_description_1')}</p>
                        <p>{translator.getMessage('popup_stats_menu_why_safe_description_2')}</p>
                        <p>{translator.getMessage('popup_stats_menu_why_safe_description_3')}</p>
                        <a
                            href={privacyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={handlePrivacyPolicyClick}
                        >
                            {translator.getMessage('privacy_policy')}
                        </a>
                    </>
                )}
                actions={(
                    <button
                        type="button"
                        onClick={closeStatsInfoModal}
                        className="stats-screen-btn stats-screen-btn--primary"
                    >
                        {translator.getMessage('popup_stats_menu_why_safe_got_it')}
                    </button>
                )}
                onClose={closeStatsInfoModal}
            />
        </>
    );
});
