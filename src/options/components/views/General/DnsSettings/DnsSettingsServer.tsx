import React from 'react';

import classNames from 'classnames';

import { type DnsServerData } from '../../../../../background/schema';
import { Radio } from '../../../ui/Radio';
import { Icon } from '../../../ui/Icon';

interface ModifyButtonProps {
    icon: string;
    onClick: () => void;
}

function ModifyButton({ icon, onClick }: ModifyButtonProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
    };

    return (
        <button
            className={classNames(
                'dns-settings__custom-btn',
                `dns-settings__custom-btn--${icon}`,
            )}
            type="button"
            onClick={handleClick}
        >
            <Icon name={icon} className="dns-settings__custom-btn-icon" />
        </button>
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
                        <ModifyButton icon="edit" onClick={() => restProps.onEdit(value)} />
                        <ModifyButton icon="basket" onClick={() => restProps.onDelete(value.id)} />
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
