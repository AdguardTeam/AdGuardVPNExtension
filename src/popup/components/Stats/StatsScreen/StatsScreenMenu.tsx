import React from 'react';

import { Select, type SelectOptionItem } from '../../../../common/components/Select';
import { Icon } from '../../ui/Icon';
import { translator } from '../../../../common/translator';

import { type StatsScreenProps } from './StatsScreen';

/**
 * Menu action types.
 */
enum MenuActions {
    None = 'none',
    WhySafe = 'why-safe',
    Clear = 'clear',
}

/**
 * Props for the StatsScreenMenu component.
 */
export type StatsScreenMenuProps = Pick<StatsScreenProps, 'shouldRenderWhySafe' | 'onClear'>;

/**
 * StatsScreenMenu component.
 */
export function StatsScreenMenu(props: StatsScreenMenuProps) {
    const { shouldRenderWhySafe, onClear } = props;

    const menuOptions: SelectOptionItem<MenuActions>[] = [{
        value: MenuActions.Clear,
        title: translator.getMessage('popup_stats_menu_clear_stats_btn'),
        className: 'stats-screen__clear',
    }];
    if (shouldRenderWhySafe) {
        menuOptions.unshift({
            value: MenuActions.WhySafe,
            title: translator.getMessage('popup_stats_menu_why_safe_btn'),
        });
    }

    // FIXME: Implement why safe modal

    const openWhySafe = () => {
        // FIXME: Implement why safe modal opening
    };

    const handleMenuAction = (value: MenuActions) => {
        switch (value) {
            case MenuActions.WhySafe:
                openWhySafe();
                break;
            case MenuActions.Clear:
                onClear();
                break;
            default:
                break;
        }
    };

    return (
        <Select
            titleIcon={<Icon icon="burger" className="stats-screen__navbar-btn-icon" />}
            value={MenuActions.None}
            className="stats-screen__select stats-screen__select--menu"
            options={menuOptions}
            onChange={handleMenuAction}
        />
    );
}
