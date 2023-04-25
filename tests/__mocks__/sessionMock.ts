export const session: { [key: string]: any } = {
    set: jest.fn(async (key: string, data: any): Promise<void> => {
        session[key] = data;
    }),
    get: jest.fn(async (key: string): Promise<string> => {
        return session[key];
    }),
};
