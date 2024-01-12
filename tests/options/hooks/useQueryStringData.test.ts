import { renderHook } from '@testing-library/react';

import { CUSTOM_DNS_ANCHOR_NAME } from '../../../src/common/constants';
import { useCustomDnsFromQuery } from '../../../src/options/hooks/useQueryStringData';

const setUrl = (url: string) => {
    window.history.pushState({}, 'Test page', url); // Set the URL for the test
};

describe('useCustomDnsFromQuery', () => {
    it('does not extract name and address from the query string if anchor is not custom dns', () => {
        setUrl('http://localhost?name=testName&address=testAddress#blabla');

        const mockHandler = jest.fn();
        renderHook(() => useCustomDnsFromQuery(mockHandler));

        expect(mockHandler).not.toBeCalled();
    });

    it('extracts name and address from the query string', () => {
        setUrl(`http://localhost?name=testName&address=testAddress#${CUSTOM_DNS_ANCHOR_NAME}`);

        const mockHandler = jest.fn();
        renderHook(() => useCustomDnsFromQuery(mockHandler));

        expect(mockHandler).toBeCalledWith({ name: 'testName', address: 'testAddress' });
    });

    it('should clear name and address from the query string', () => {
        setUrl(`http://localhost?name=testName&address=testAddress&otherParam=otherValue#${CUSTOM_DNS_ANCHOR_NAME}`);

        renderHook(() => useCustomDnsFromQuery(() => {}));

        expect(window.location.search).toBe('?otherParam=otherValue');
    });
});
