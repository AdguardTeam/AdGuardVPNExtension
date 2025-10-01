import React, { type SetStateAction, useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { Select, type SelectOptionItem } from '../../../../common/components/Select';
import { translator } from '../../../../common/translator';
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
    Enable = 'enable',
    Disable = 'disable',
    Clear = 'clear',
}

/**
 * Props for the {@link StatsScreenMenu} component.
 */
export type StatsScreenMenuProps = Pick<StatsScreenBaseProps, 'isDisabled' | 'onDisableChange' | 'onClear'>;

/**
 * Component that renders the menu for the stats screen.
 * It contains 'Toggle stats' and 'Clear stats' button with their modals.
 */
export const StatsScreenMenu = observer((props: StatsScreenMenuProps) => {
    const { isDisabled, onDisableChange, onClear } = props;
    const { statsStore, telemetryStore } = useContext(rootStore);

    const {
        isMenuOpen,
        isDisableModalOpen,
        isClearModalOpen,
        setIsMenuOpen,
        setIsDisableModalOpen,
        setIsClearModalOpen,
    } = statsStore;

    const canSendSettingsTelemetry = isMenuOpen
        && !isClearModalOpen // `ClearStatsScreen` is rendered on top of this screen
        && !isDisableModalOpen; // `DisableStatsScreen` is rendered on top of this screen

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.SettingsStatsScreen,
        canSendSettingsTelemetry,
    );

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DisableStatsScreen,
        isDisableModalOpen,
    );

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.ClearStatsScreen,
        isClearModalOpen,
    );

    const handleOnMenuActiveChange = (isActive: SetStateAction<boolean>): void => {
        if (typeof isActive === 'function') {
            setIsMenuOpen(isActive(isMenuOpen));
        } else {
            setIsMenuOpen(isActive);
        }
    };

    const menuOptions: SelectOptionItem<MenuActions>[] = [
        {
            value: isDisabled ? MenuActions.Enable : MenuActions.Disable,
            title: isDisabled
                ? translator.getMessage('popup_stats_menu_enable_stats_btn')
                : translator.getMessage('popup_stats_menu_disable_stats_btn'),
        },
        {
            value: MenuActions.Clear,
            title: translator.getMessage('popup_stats_menu_clear_stats_btn'),
            className: 'stats-screen__clear',
        },
    ];

    const enableStats = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.MenuEnableStatsClick,
            TelemetryScreenName.SettingsStatsScreen,
        );
        onDisableChange(false);
    };

    const openDisableModal = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OpenDisableStatsClick,
            TelemetryScreenName.SettingsStatsScreen,
        );
        setIsDisableModalOpen(true);
    };

    const closeDisableModal = (): void => {
        setIsDisableModalOpen(false);
    };

    const handleDisableClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.DisableStatsClick,
            TelemetryScreenName.DisableStatsScreen,
        );
        closeDisableModal();
        onDisableChange(true);
    };

    const openClearModal = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OpenClearStatsClick,
            TelemetryScreenName.SettingsStatsScreen,
        );
        setIsClearModalOpen(true);
    };

    const closeClearModal = (): void => {
        setIsClearModalOpen(false);
    };

    const handleClearClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.ClearStatsClick,
            TelemetryScreenName.ClearStatsScreen,
        );
        closeClearModal();
        onClear();
    };

    const handleMenuAction = (value: MenuActions): void => {
        switch (value) {
            case MenuActions.Enable:
                enableStats();
                break;
            case MenuActions.Disable:
                openDisableModal();
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
                titleIcon={<Icon name="bullets" />}
                value={MenuActions.None}
                className="stats-screen__select stats-screen__select--menu"
                options={menuOptions}
                isActive={isMenuOpen}
                onChange={handleMenuAction}
                onIsActiveChange={handleOnMenuActiveChange}
            />
            {!isDisabled && (
                <StatsScreenModal
                    isOpen={isDisableModalOpen}
                    title={translator.getMessage('popup_stats_menu_disable_stats_title')}
                    description={translator.getMessage('popup_stats_menu_disable_stats_description')}
                    actions={(
                        <>
                            <button
                                type="button"
                                onClick={handleDisableClick}
                                className="stats-screen-btn stats-screen-btn--red"
                            >
                                {translator.getMessage('popup_stats_menu_disable_stats_disable_btn')}
                            </button>
                            <button
                                type="button"
                                onClick={closeDisableModal}
                                className="stats-screen-btn stats-screen-btn--outline"
                            >
                                {translator.getMessage('popup_stats_menu_disable_stats_cancel_btn')}
                            </button>
                        </>
                    )}
                    onClose={closeDisableModal}
                />
            )}
            <StatsScreenModal
                isOpen={isClearModalOpen}
                title={translator.getMessage('popup_stats_menu_clear_stats_title')}
                description={translator.getMessage('popup_stats_menu_clear_stats_description')}
                actions={(
                    <>
                        <button
                            type="button"
                            onClick={handleClearClick}
                            className="stats-screen-btn stats-screen-btn--red"
                        >
                            {translator.getMessage('popup_stats_menu_clear_stats_clear_btn')}
                        </button>
                        <button
                            type="button"
                            onClick={closeClearModal}
                            className="stats-screen-btn stats-screen-btn--outline"
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
