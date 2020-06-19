import { formatter } from '../../../src/lib/translator/formatter';

describe('formatter', () => {
    it('formats', () => {
        const message = formatter('<a>some text</a>', {
            a: (chunks) => `<a href="#">${chunks}</a>`,
        });
        expect(message)
            .toEqual(['<a href="#">some text</a>']);
    });

    it('formats nested messages', () => {
        const message = formatter('before tag text <a>some text <b>inside span</b> tag</a>', {
            a: (...chunks) => `<a href="#">${chunks}</a>`,
            b: (...chunks) => `<span>${chunks}</span>`,
        });

        expect(message)
            .toEqual(['before tag text ', '<a href="#">some text <span>inside span</span> tag</a>']);
    });

    it('formats nested placeholders', () => {
        const rawStr = '<span>{value} {unit}</span> remaining this month';

        const formatted = formatter(rawStr, {
            value: 10,
            unit: 'kb',
            span: (chunks) => (`<span class='test'>${chunks}</span>`),
        });

        expect(formatted).toEqual(["<span class='test'>10 kb</span>", ' remaining this month']);
    });

    it('handles empty input without errors', () => {
        const formatted = formatter(undefined);
        expect(formatted).toEqual([]);
    });
});
