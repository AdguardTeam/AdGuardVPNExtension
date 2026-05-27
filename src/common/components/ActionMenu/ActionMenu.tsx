import React, { type ReactElement } from 'react';

import { Select, type SelectOptionItem } from '../Select';

/**
 * Single action item descriptor.
 */
export interface ActionMenuItem<T extends string> {
    /**
     * Value identifying the action.
     */
    value: T;

    /**
     * Display label for the menu item.
     */
    title: React.ReactNode;

    /**
     * Whether to hide this item from the menu.
     */
    hidden?: boolean;

    /**
     * Additional class name for the item.
     */
    className?: string;
}

/**
 * ActionMenu component props.
 */
interface ActionMenuProps<T extends string> {
    /**
     * Text shown on the trigger button.
     */
    label: React.ReactNode;

    /**
     * Menu items.
     */
    items: ActionMenuItem<T>[];

    /**
     * Called when a menu item is clicked.
     */
    onAction: (value: T) => Promise<void>;

    /**
     * Additional class name for the root container.
     */
    className?: string;

    /**
     * Additional class name for the trigger button.
     */
    buttonClassName?: string;
}

/**
 * Internally used value for the placeholder option that shows the label.
 */
const PLACEHOLDER_VALUE = '__action_menu_placeholder__';

/**
 * Thin wrapper around Select for action menus.
 * Hides the "selected value" semantics by using an always-skipped
 * placeholder option as the trigger label.
 */
export function ActionMenu<T extends string>({
    label,
    items,
    onAction,
    className,
    buttonClassName,
}: ActionMenuProps<T>): ReactElement {
    const options: SelectOptionItem<T | typeof PLACEHOLDER_VALUE>[] = [
        {
            value: PLACEHOLDER_VALUE,
            title: label,
            shouldSkip: true,
        },
        ...items.map((item) => ({
            value: item.value,
            title: item.title,
            shouldSkip: item.hidden,
            className: item.className,
        })),
    ];

    const handleChange = async (value: T | typeof PLACEHOLDER_VALUE): Promise<void> => {
        if (value !== PLACEHOLDER_VALUE) {
            await onAction(value);
        }
    };

    return (
        <Select
            className={className}
            buttonClassName={buttonClassName}
            value={PLACEHOLDER_VALUE}
            options={options}
            onChange={handleChange}
        />
    );
}
