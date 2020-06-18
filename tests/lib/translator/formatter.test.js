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
});
