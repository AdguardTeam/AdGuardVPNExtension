import React from 'react';

import { type DnsServerData } from '../../../../../background/schema';
import { Radio } from '../../../ui/Radio';

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
}

export type DnsSettingsServerProps = DnsSettingsServerDefinedProps | DnsSettingsServerCustomProps;

export function DnsSettingsServer({
    value,
    active,
    custom,
    onSelect,
}: DnsSettingsServerProps) {
    if (custom) {
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
