import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';
import { renderHook } from '@testing-library/react';

import { CUSTOM_DNS_ANCHOR_NAME } from '../../../src/common/constants';
import { useCustomDnsFromQuery } from '../../../src/options/hooks/useQueryStringData';

const setUrl = (url: string): void => {
    vi.stubGlobal('location', new URL(url));
    vi.stubGlobal('history', {
        pushState: vi.fn().mockImplementation((_, __, newUrl) => {
            const urlObj = new URL(newUrl as string, window.location.origin);
            vi.stubGlobal('location', urlObj);
        }),
    });
};

describe('useCustomDnsFromQuery', () => {
    beforeEach(() => {
        // Reset the stub before each test to ensure isolation
        vi.unstubAllGlobals();
    });

    it('does not extract name and address from the query string if anchor is not custom dns', () => {
        setUrl('http://localhost?name=testName&address=testAddress#blabla');

        const mockHandler = vi.fn();
        renderHook(() => useCustomDnsFromQuery(mockHandler));

        expect(mockHandler).not.toBeCalled();
    });

    it('extracts name and address from the query string', () => {
        setUrl(`http://localhost?name=testName&address=testAddress#${CUSTOM_DNS_ANCHOR_NAME}`);

        const mockHandler = vi.fn();
        renderHook(() => useCustomDnsFromQuery(mockHandler));

        expect(mockHandler).toBeCalledWith({ name: 'testName', address: 'testAddress' });
    });

    it('should clear name and address from the query string', () => {
        setUrl(`http://localhost?name=testName&address=testAddress&otherParam=otherValue#${CUSTOM_DNS_ANCHOR_NAME}`);

        renderHook(() => useCustomDnsFromQuery(() => {}));

        expect(window.location.search).toBe('?otherParam=otherValue');
    });
});
