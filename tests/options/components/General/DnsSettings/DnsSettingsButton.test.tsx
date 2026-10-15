import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import { render, fireEvent } from '@testing-library/react';

vi.mock('../../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string, params?: Record<string, unknown>) => {
            if (key === 'settings_dns_label') {
                return 'DNS server';
            }
            if (key === 'settings_dns_description') {
                return 'Allows to select a DNS server to resolve DNS requests';
            }
            if (key === 'settings_description_current') {
                return `Current: ${(params as Record<string, string>)?.mode || ''}`;
            }
            return key;
        }),
    },
}));

vi.mock('../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        dnsStore: {
            getProfileDnsServerName: vi.fn(() => 'AdGuard DNS'),
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { DnsSettingsButton } from '../../../../../src/options/components/General/DnsSettings/DnsSettingsButton';

/**
 * Renders DnsSettingsButton and returns the container for querying.
 *
 * @param onClick Click handler passed to the component.
 *
 * @returns Rendered container.
 */
function renderButton(onClick: () => void = vi.fn()): { container: HTMLElement } {
    const { container } = render(
        <DnsSettingsButton profileId="profile-2" onClick={onClick} />,
    );
    return { container };
}

describe('DnsSettingsButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the description and the profile DNS server name', () => {
        const { container } = renderButton();

        expect(container.textContent).toContain(
            'Allows to select a DNS server to resolve DNS requests',
        );

        const state = container.querySelector('.controls__state');

        expect(state).not.toBeNull();
        expect(state!.textContent).toBe('AdGuard DNS');
    });

    it('should call the click handler', () => {
        const onClick = vi.fn();
        const { container } = renderButton(onClick);

        fireEvent.click(container.querySelector('.dns-settings__btn')!);

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
