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

const mockSetExclusionsSearchValue = vi.hoisted(() => vi.fn());
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
            exclusionsSearchValue: '',
            setExclusionsSearchValue: mockSetExclusionsSearchValue,
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import {
    ExclusionsSearch,
} from '../../../../../../src/options/components/Exclusions/Search/ExclusionsSearch/ExclusionsSearch';

describe('ExclusionsSearch telemetry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('should send the search website telemetry once when the user starts typing', () => {
        const { container } = render(<ExclusionsSearch />);
        const input = container.querySelector('input')!;

        fireEvent.change(input, { target: { value: 'ex' } });
        fireEvent.change(input, { target: { value: 'example' } });

        expect(mockSendCustomEvent).toHaveBeenCalledTimes(1);
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'search_website',
            'exclusions_screen',
        );
        expect(mockSetExclusionsSearchValue).toHaveBeenLastCalledWith('example');
    });
});
