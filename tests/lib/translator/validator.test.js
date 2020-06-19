import { isTargetStrValid } from '../../../src/lib/translator/validator';

describe('validator', () => {
    it('returns true if message consists only from string nodes', () => {
        const baseStr = 'test string';
        const targetStr = 'тестовая строка';

        const result = isTargetStrValid(baseStr, targetStr);
        expect(result).toBeTruthy();
    });

    it('returns true if message has the same tag nodes count', () => {
        const baseStr = 'test string <a>has node</a>';
        const targetStr = 'тестовая строка <a>с нодой</a>';

        const result = isTargetStrValid(baseStr, targetStr);
        expect(result).toBeTruthy();
    });

    it('returns false if translation has wrong tag', () => {
        const baseStr = 'test string <a>has node</a>';
        const targetStr = 'тестовая строка <b>с нодой</b>';

        const result = isTargetStrValid(baseStr, targetStr);
        expect(result).toBeFalsy();
    });

    it('returns true if placeholders are same', () => {
        const baseStr = 'test string {placeholder}';
        const targetStr = 'тестовая строка {placeholder}';

        const result = isTargetStrValid(baseStr, targetStr);
        expect(result).toBeTruthy();
    });

    it('returns false if translators changed placeholder value', () => {
        const baseStr = 'test string {placeholder}';
        const targetStr = 'тестовая строка {плейсхолдер}';

        const result = isTargetStrValid(baseStr, targetStr);
        expect(result).toBeFalsy();
    });

    it('returns false if target string is not valid', () => {
        const baseStr = 'test string <a>has node</a>';
        const targetStr = 'тестовая строка с нодой';

        const result = isTargetStrValid(baseStr, targetStr);
        expect(result).toBeFalsy();
    });

    it('returns false if target has same number of nodes, but node is is with another type', () => {
        const baseStr = 'test string <a>has node</a>';
        const targetStr = 'тестовая строка с нодой {placeholder}';

        const result = isTargetStrValid(baseStr, targetStr);
        expect(result).toBeFalsy();
    });

    it('validates nested nodes', () => {
        const baseStr = 'test string <a>has <b>nested</b> node</a>';
        const targetStr = 'тестовая строка <a>имеет <b>встроенную</b> ноду</a>';

        const result = isTargetStrValid(baseStr, targetStr);
        expect(result).toBeTruthy();
    });
});
