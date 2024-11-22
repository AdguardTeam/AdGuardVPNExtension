import React from 'react';

import { type DnsServerData } from '../../../../../background/schema';
import { Radio } from '../../../ui/Radio';
import { IconButton, type IconButtonProps } from '../../../ui/Icon';

interface ModifyButtonProps {
    icon: string;
    variant?: IconButtonProps['variant'];
    onClick: () => void;
}

function ModifyButton({ icon, variant, onClick }: ModifyButtonProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
    };

    return (
        <IconButton name={icon} variant={variant} onClick={handleClick} />
    );
}

interface DnsSettingsServerBaseProps {
    value: DnsServerData;
    active: boolean;
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
    value,
    active,
    onSelect,
    ...restProps
}: DnsSettingsServerProps) {
    if (restProps.custom) {
        return (
            <Radio
                value={value.id}
                active={active}
                title={value.title}
                description={value.address}
                onSelect={onSelect}
                action={(
                    <div className="dns-settings__custom-actions">
                        <ModifyButton
                            icon="edit"
                            variant="success"
                            onClick={() => restProps.onEdit(value)}
                        />
                        <ModifyButton
                            icon="basket"
                            variant="error"
                            onClick={() => restProps.onDelete(value.id)}
                        />
                    </div>
                )}
            />
        );
    }

    return (
        <Radio
            value={value.id}
            active={active}
            title={value.title}
            description={value.desc}
            onSelect={onSelect}
        />
    );
}
