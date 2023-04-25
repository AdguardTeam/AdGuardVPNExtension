type ReturnData = {
    [key: string]: string | number | boolean | null;
};

/**
 * Mocks fetch function to return a rejected Promise.
 */
export const fetchRejectMock = () => {
    global.fetch = jest.fn(() => Promise.reject());
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
