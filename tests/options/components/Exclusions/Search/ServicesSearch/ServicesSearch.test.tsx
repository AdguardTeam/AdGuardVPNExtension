import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

const mockSetServicesSearchValue = vi.hoisted(() => vi.fn());
const mockSendCustomEvent = vi.hoisted(() => vi.fn());

vi.mock('../../../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        exclusionsStore: {
            servicesSearchValue: '',
            setServicesSearchValue: mockSetServicesSearchValue,
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import {
    ServicesSearch,
} from '../../../../../../src/options/components/Exclusions/Search/ServicesSearch/ServicesSearch';

describe('ServicesSearch telemetry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('should send the search from list telemetry once when the user starts typing', () => {
        const { container } = render(<ServicesSearch />);
        const input = container.querySelector('input')!;

        fireEvent.change(input, { target: { value: 'you' } });
        fireEvent.change(input, { target: { value: 'youtube' } });

        expect(mockSendCustomEvent).toHaveBeenCalledTimes(1);
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'search_from_list',
            'dialog_add_website_exclusion',
        );
        expect(mockSetServicesSearchValue).toHaveBeenLastCalledWith('youtube');
    });
});
