import { getLocalTimeString } from '../../src/common/logger';

describe('Logger tests', () => {
    afterAll(() => {
        jest.useRealTimers();
    });

    it('getLocalTimeString test', () => {
        const fakeDate = new Date(2030, 0, 2, 3, 4, 5, 678);
        const expectedDateString = '2030-01-02T03:04:05.678';

        jest
            .useFakeTimers('modern')
            .setSystemTime(fakeDate);

        const date = new Date();
        const localTimeString = getLocalTimeString(date);
        expect(localTimeString).toEqual(expectedDateString);
    });
});
