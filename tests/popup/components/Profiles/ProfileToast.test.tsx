import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';
import { render, cleanup } from '@testing-library/react';

const mockVpnStore = vi.hoisted(() => ({
    profileSwitchNotification: 0,
    clearProfileSwitchNotification: vi.fn(),
}));

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string, params?: Record<string, string>) => {
            return params?.profile_name ? `${key}:${params.profile_name}` : key;
        }),
    },
}));

vi.mock('../../../../src/popup/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    return { rootStore: React.createContext({ vpnStore: mockVpnStore }) };
});

// eslint-disable-next-line import/first
import { ProfileToast } from '../../../../src/popup/components/Profiles/ProfileToast/ProfileToast';

/**
 * Returns the id of the first icon rendered by the toast.
 *
 * @param container Rendered container.
 *
 * @returns Icon id or null.
 */
const getIconId = (container: HTMLElement): string | null => {
    return container.querySelector('use')?.getAttribute('xlink:href') ?? null;
};

describe('ProfileToast', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockVpnStore.profileSwitchNotification = 0;
    });

    afterEach(() => {
        cleanup();
    });

    it('should render nothing when there is no notification', () => {
        const { container } = render(<ProfileToast />);

        expect(container.firstChild).toBeNull();
    });

    it('should show the error message', () => {
        mockVpnStore.profileSwitchNotification = 1;

        const { container } = render(<ProfileToast />);

        expect(container.textContent).toBe('profile_apply_error');
        expect(getIconId(container)).toBe('#info');
    });
});
