import React, { type SetStateAction, useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { Select, type SelectOptionItem } from '../../../../common/components/Select';
import { translator } from '../../../../common/translator';
import { getPrivacyAndEulaUrls } from '../../../../common/forwarderHelpers';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { Icon } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';

import { type StatsScreenBaseProps } from './StatsScreen';
import { StatsScreenModal } from './StatsScreenModal';

/**
 * Menu action types.
 */
enum MenuActions {
    None = 'none',
    WhySafe = 'why-safe',
    Clear = 'clear',
}

/**
 * Props for the {@link StatsScreenMenu} component.
 */
export type StatsScreenMenuProps = Pick<StatsScreenBaseProps, 'onClear'>;

/**
 * Component that renders the menu for the stats screen.
 * It contains 'Why it's safe' button and 'Clear stats' button with their modals.
 */
export const StatsScreenMenu = observer((props: StatsScreenMenuProps) => {
    const { onClear } = props;
    const { statsStore, telemetryStore, settingsStore } = useContext(rootStore);

    const { forwarderDomain } = settingsStore;

    const {
        isMenuOpen,
        isWhySafeModalOpen,
        isClearModalOpen,
        setIsMenuOpen,
        setIsWhySafeModalOpen,
        setIsClearModalOpen,
    } = statsStore;

    const { privacyUrl } = getPrivacyAndEulaUrls(forwarderDomain);

    const canSendSettingsTelemetry = isMenuOpen
        && !isWhySafeModalOpen // `WhySafeScreen` is rendered on top of this screen
        && !isClearModalOpen; // `ClearStatsScreen` is rendered on top of this screen

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.SettingsStatsScreen,
        canSendSettingsTelemetry,
    );

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.WhySafeScreen,
        isWhySafeModalOpen,
    );

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.ClearStatsScreen,
        isClearModalOpen,
    );

    const handleOnMenuActiveChange = (isActive: SetStateAction<boolean>) => {
        if (typeof isActive === 'function') {
            setIsMenuOpen(isActive(isMenuOpen));
        } else {
            setIsMenuOpen(isActive);
        }
    };

    const menuOptions: SelectOptionItem<MenuActions>[] = [
        {
            value: MenuActions.WhySafe,
            title: translator.getMessage('popup_stats_menu_why_safe_btn'),
        },
        {
            value: MenuActions.Clear,
            title: translator.getMessage('popup_stats_menu_clear_stats_btn'),
            className: 'stats-screen__clear',
        },
    ];

    const openWhySafeModal = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.WhySafeClick,
            TelemetryScreenName.SettingsStatsScreen,
        );
        setIsWhySafeModalOpen(true);
    };

    const closeWhySafeModal = () => {
        setIsWhySafeModalOpen(false);
    };

    const openClearModal = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OpenClearStatsClick,
            TelemetryScreenName.SettingsStatsScreen,
        );
        setIsClearModalOpen(true);
    };

    const closeClearModal = () => {
        setIsClearModalOpen(false);
    };

    const handleClearClick = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.ClearStatsClick,
            TelemetryScreenName.ClearStatsScreen,
        );
        closeClearModal();
        onClear();
    };

    const handlePrivacyPolicyClick = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.StatsPrivacyClick,
            TelemetryScreenName.WhySafeScreen,
        );
    };

    const handleMenuAction = (value: MenuActions) => {
        switch (value) {
            case MenuActions.WhySafe:
                openWhySafeModal();
                break;
            case MenuActions.Clear:
                openClearModal();
                break;
            default:
                break;
        }
    };

    return (
        <>
            <Select
                titleIcon={<Icon name="sidebar-burger" />}
                value={MenuActions.None}
                className="stats-screen__select stats-screen__select--menu"
                options={menuOptions}
                isActive={isMenuOpen}
                onChange={handleMenuAction}
                onIsActiveChange={handleOnMenuActiveChange}
            />
            <StatsScreenModal
                isOpen={isWhySafeModalOpen}
                title={translator.getMessage('popup_stats_menu_why_safe_title')}
                description={(
                    <>
                        <p>{translator.getMessage('popup_stats_menu_why_safe_description_1')}</p>
                        <p>{translator.getMessage('popup_stats_menu_why_safe_description_2')}</p>
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
                        onClick={closeWhySafeModal}
                        className="stats-screen-modal__btn stats-screen-modal__btn--primary"
                    >
                        {translator.getMessage('popup_stats_menu_why_safe_got_it')}
                    </button>
                )}
                onClose={closeWhySafeModal}
            />
            <StatsScreenModal
                isOpen={isClearModalOpen}
                title={translator.getMessage('popup_stats_menu_clear_stats_title')}
                description={translator.getMessage('popup_stats_menu_clear_stats_description')}
                actions={(
                    <>
                        <button
                            type="button"
                            onClick={handleClearClick}
                            className="stats-screen-modal__btn stats-screen-modal__btn--red"
                        >
                            {translator.getMessage('popup_stats_menu_clear_stats_clear_btn')}
                        </button>
                        <button
                            type="button"
                            onClick={closeClearModal}
                            className="stats-screen-modal__btn stats-screen-modal__btn--outline"
                        >
                            {translator.getMessage('popup_stats_menu_clear_stats_cancel_btn')}
                        </button>
                    </>
                )}
                onClose={closeClearModal}
            />
        </>
    );
});
