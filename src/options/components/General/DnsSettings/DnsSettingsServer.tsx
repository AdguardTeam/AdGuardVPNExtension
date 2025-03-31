import React from 'react';

import { type DnsServerData } from '../../../../background/schema';
import { Radio } from '../../ui/Radio';
import { IconButton, type IconButtonProps } from '../../ui/Icon';

/**
 * Modify button props.
 */
interface ModifyButtonProps {
    /**
     * Icon name.
     */
    icon: string;

    /**
     * Hover color.
     */
    hoverColor?: IconButtonProps['hoverColor'];

    /**
     * Click handler.
     */
    onClick: () => void;
}

/**
 * Modify button component (Delete / Edit).
 */
function ModifyButton({ icon, hoverColor, onClick }: ModifyButtonProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
    };

    return (
        <IconButton name={icon} hoverColor={hoverColor} onClick={handleClick} />
    );
}

/**
 * DNS server base props.
 */
interface DnsSettingsServerBaseProps {
    /**
     * DNS server name.
     */
    name: string;

    /**
     * DNS server data.
     */
    value: DnsServerData;

    /**
     * Is active flag.
     */
    isActive: boolean;

    /**
     * Select DNS server handler.
     *
     * @param dnsServerId DNS server ID.
     */
    onSelect: (dnsServerId: string) => void;
}

/**
 * Defined DNS server component props.
 */
interface DnsSettingsServerDefinedProps extends DnsSettingsServerBaseProps {
    /**
     * Defined DNS server flag.
     */
    custom?: false;
}

/**
 * Custom DNS server component props.
 */
interface DnsSettingsServerCustomProps extends DnsSettingsServerBaseProps {
    /**
     * Custom DNS server flag.
     */
    custom: true;

    /**
     * Edit custom DNS server handler.
     *
     * @param dnsServer DNS server data.
     */
    onEdit: (dnsServer: DnsServerData) => void;

    /**
     * Delete custom DNS server handler.
     *
     * @param dnsServerId DNS server ID.
     */
    onDelete: (dnsServerId: string) => void;
}

/**
 * DNS server component props.
 * It can be either defined or custom.
 */
export type DnsSettingsServerProps = DnsSettingsServerDefinedProps | DnsSettingsServerCustomProps;

/**
 * DNS server component.
 */
export function DnsSettingsServer({
    name,
    value,
    isActive,
    onSelect,
    ...restProps
}: DnsSettingsServerProps) {
    if (restProps.custom) {
        return (
            <Radio
                name={name}
                value={value.id}
                isActive={isActive}
                title={value.title}
                labelTitle={`${value.title} (${value.address})`}
                description={value.address}
                onSelect={onSelect}
                className="dns-settings__custom"
                action={(
                    <span className="dns-settings__custom-actions">
                        <ModifyButton
                            icon="edit"
                            hoverColor="success"
                            onClick={() => restProps.onEdit(value)}
                        />
                        <ModifyButton
                            icon="basket"
                            hoverColor="error"
                            onClick={() => restProps.onDelete(value.id)}
                        />
                    </span>
                )}
            />
        );
    }

    return (
        <Radio
            name={name}
            value={value.id}
            isActive={isActive}
            title={value.title}
            labelTitle={value.title}
            description={value.desc}
            onSelect={onSelect}
        />
    );
}
