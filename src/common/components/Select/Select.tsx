import React, {
    useRef,
    useState,
    type SetStateAction,
    type ReactElement,
} from 'react';

import classNames from 'classnames';

import { useOutsideClick } from '../../hooks/useOutsideClick';
import { useOutsideFocus } from '../../hooks/useOutsideFocus';
import { Icon } from '../Icons';

import './select.pcss';

/**
 * Select option item.
 */
export interface SelectOptionItem<T> {
    /**
     * Value of the option.
     */
    value: T;

    /**
     * Title of the option.
     */
    title: React.ReactNode;

    /**
     * Should skip rendering of the option.
     */
    shouldSkip?: boolean;

    /**
     * Additional class name for the option.
     */
    className?: string;
}

/**
 * SelectOption component props.
 */
interface SelectOptionProps<T> extends SelectOptionItem<T> {
    /**
     * Is the option is selected one or not.
     */
    isActive?: boolean;

    /**
     * Is the select active or not. Used to control tab index.
     */
    isSelectActive?: boolean;

    /**
     * Click event handler.
     */
    onClick: (value: T) => void;
}

/**
 * SelectOption component.
 */
function SelectOption<T extends string>({
    value,
    title,
    isActive,
    shouldSkip,
    isSelectActive,
    className,
    onClick,
}: SelectOptionProps<T>): ReactElement | null {
    const classes = classNames(
        'select__item has-tab-focus select__btn-reset',
        isActive && 'select__item--active',
        className,
    );

    const handleClick = (): void => {
        onClick(value);
    };

    if (shouldSkip) {
        return null;
    }

    return (
        <button
            className={classes}
            type="button"
            onClick={handleClick}
            tabIndex={!isSelectActive ? -1 : undefined}
        >
            {title}
            <Icon
                name="tick"
                color="product"
                className="select__item-icon"
            />
        </button>
    );
}

/**
 * Select component props.
 */
export interface SelectProps<T> {
    /**
     * Icon that will be shown beside the title.
     * You can add 'select__btn-icon' class to it to inherit styles.
     */
    titleIcon?: React.ReactNode;

    /**
     * Current selected value of the select.
     */
    value: T;

    /**
     * Options of the select.
     */
    options: SelectOptionItem<T>[];

    /**
     * Is the select active or not.
     */
    isActive?: boolean;

    /**
     * Additional class name for the select.
     */
    className?: string;

    /**
     * Change event handler.
     */
    onChange: (value: T) => void;

    /**
     * Is active change event handler.
     */
    onIsActiveChange?: (value: SetStateAction<boolean>) => void;

    /**
     * Callback that will be called when the select button is clicked.
     */
    onClick?: () => void;
}

/**
 * Select component.
 */
export function Select<T extends string>({
    titleIcon,
    value,
    options,
    isActive: outsideActive,
    className,
    onChange,
    onIsActiveChange,
    onClick,
}: SelectProps<T>): ReactElement {
    const activeItem = options.find((option) => option.value === value);

    const ref = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const [localActive, setLocalActive] = useState(false);
    const isActive = outsideActive !== undefined ? outsideActive : localActive;

    const classes = classNames(
        'select',
        isActive && 'select--active',
        className,
    );

    const setActive = (value: boolean | ((oldValue: boolean) => boolean)): void => {
        if (!onIsActiveChange) {
            setLocalActive(value);
        } else {
            onIsActiveChange(value);
        }
    };

    const handleClose = (): void => {
        // Reset scroll so the list always starts from the top when reopened.
        if (listRef.current) {
            listRef.current.scrollTop = 0;
        }
        setActive(false);
    };

    const handleToggle = (): void => {
        if (onClick) {
            onClick();
        }
        setActive((currentActive) => !currentActive);
    };

    const handleChange = (value: T): void => {
        handleClose();
        onChange(value);
    };

    useOutsideClick(ref, handleClose);
    useOutsideFocus(ref, handleClose);

    return (
        <div ref={ref} className={classes}>
            <button
                className="select__btn has-tab-focus select__btn-reset"
                type="button"
                onClick={handleToggle}
            >
                <span className="select__btn-text text-ellipsis">
                    {activeItem?.title}
                </span>
                {titleIcon || (
                    <Icon
                        name="arrow-down"
                        rotation={isActive ? 'upside-down' : 'none'}
                    />
                )}
            </button>
            <div ref={listRef} className="select__list">
                {options.map((option) => (
                    <SelectOption
                        key={option.value}
                        value={option.value}
                        title={option.title}
                        className={option.className}
                        isActive={option.value === value}
                        shouldSkip={option.shouldSkip}
                        isSelectActive={isActive}
                        onClick={handleChange}
                    />
                ))}
            </div>
        </div>
    );
}
