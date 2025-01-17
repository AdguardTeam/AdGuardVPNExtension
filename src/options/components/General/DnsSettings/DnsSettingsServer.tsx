import React from 'react';

import { type DnsServerData } from '../../../../background/schema';
import { Radio } from '../../ui/Radio';
import { IconButton, type IconButtonProps } from '../../ui/Icon';

interface ModifyButtonProps {
    icon: string;
    hoverColor?: IconButtonProps['hoverColor'];
    onClick: () => void;
}

function ModifyButton({ icon, hoverColor, onClick }: ModifyButtonProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
    };

    return (
        <IconButton name={icon} hoverColor={hoverColor} onClick={handleClick} />
    );
}

interface DnsSettingsServerBaseProps {
    name: string;
    value: DnsServerData;
    isActive: boolean;
    onSelect: (dnsServerId: string) => void;
}

interface DnsSettingsServerDefinedProps extends DnsSettingsServerBaseProps {
    custom?: false;
}

interface DnsSettingsServerCustomProps extends DnsSettingsServerBaseProps {
    custom: true;
    onEdit: (dnsServer: DnsServerData) => void;
    onDelete: (dnsServerId: string) => void;
}

export type DnsSettingsServerProps = DnsSettingsServerDefinedProps | DnsSettingsServerCustomProps;

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
            description={value.desc}
            onSelect={onSelect}
            className="dns-settings__custom"
        />
    );
}
