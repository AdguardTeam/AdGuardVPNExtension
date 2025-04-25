import React, { useState } from 'react';

import { Select, type SelectOptionItem } from '../../../../common/components/Select';
import { translator } from '../../../../common/translator';
import { Icon } from '../../ui/Icon';

import { type StatsScreenProps } from './StatsScreen';
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
 * Props for the StatsScreenMenu component.
 */
export type StatsScreenMenuProps = Pick<StatsScreenProps, 'shouldRenderWhySafe' | 'privacyPolicyUrl' | 'onClear'>;

/**
 * StatsScreenMenu component.
 */
export function StatsScreenMenu(props: StatsScreenMenuProps) {
    const { shouldRenderWhySafe, privacyPolicyUrl, onClear } = props;

    const [isWhySafeModalOpen, setIsWhySafeModalOpen] = useState(false);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

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

    const openWhySafeModal = () => {
        setIsWhySafeModalOpen(true);
    };

    const closeWhySafeModal = () => {
        setIsWhySafeModalOpen(false);
    };

    const openClearModal = () => {
        setIsClearModalOpen(true);
    };

    const closeClearModal = () => {
        setIsClearModalOpen(false);
    };

    const handleClearClick = () => {
        closeClearModal();
        onClear();
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
                titleIcon={<Icon icon="burger" className="stats-screen__navbar-btn-icon" />}
                value={MenuActions.None}
                className="stats-screen__select stats-screen__select--menu"
                options={menuOptions}
                onChange={handleMenuAction}
            />
            {shouldRenderWhySafe && (
                <StatsScreenModal
                    isOpen={isWhySafeModalOpen}
                    title={translator.getMessage('popup_stats_menu_why_safe_title')}
                    description={(
                        <>
                            <ul>
                                <li>{translator.getMessage('popup_stats_menu_why_safe_description_1')}</li>
                                <li>{translator.getMessage('popup_stats_menu_why_safe_description_2')}</li>
                            </ul>
                            <a
                                href={privacyPolicyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
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
}
