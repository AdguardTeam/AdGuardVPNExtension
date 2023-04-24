type ReturnData = {
    [key: string]: string | number | boolean | null;
};

/**
 * Mocks fetch function to return a rejected Promise with the provided JSON data.
 * @param data
 */
export const fetchRejectMock = (data: ReturnData | Promise<ReturnData>) => {
    // eslint-disable-next-line prefer-promise-reject-errors
    global.fetch = jest.fn(() => Promise.reject({
        json: () => {
            return data;
        },
    }));
};

/**
 * Mocks fetch function to return a resolved Promise with the provided JSON data.
 * @param data
 */
export const fetchResolveMock = (data: ReturnData | Promise<ReturnData>) => {
    // @ts-ignore
    global.fetch = jest.fn(() => Promise.resolve({
        json: () => {
            return data;
        },
    }));
};
