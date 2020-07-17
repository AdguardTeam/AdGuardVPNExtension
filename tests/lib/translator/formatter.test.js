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

    it('formats placeholders', () => {
        const rawStr = 'Ping %pingValue% ms';
        const formatted = formatter(rawStr, {
            pingValue: 100,
        });

        expect(formatted).toEqual(['Ping ', 100, ' ms']);
    });

    it('formats nested placeholders', () => {
        const rawStr = '<span>%value% %unit%</span> remaining this month';

        const formatted = formatter(rawStr, {
            value: 10,
            unit: 'kb',
            span: (chunks) => (`<span class='test'>${chunks}</span>`),
        });

        expect(formatted).toEqual(["<span class='test'>10 kb</span>", ' remaining this month']);
    });

    it('formats placeholder nested in tag', () => {
        const rawStr = 'You are signing in as <div>%username%</div>';
        const formatted = formatter(rawStr, {
            username: 'maximtop@gmail.com',
            div: (chunks) => (`<div class='test'>${chunks}</div>`),
        });
        expect(formatted).toEqual(['You are signing in as ', "<div class='test'>maximtop@gmail.com</div>"]);
    });

    it('handles empty input without errors', () => {
        const formatted = formatter(undefined);
        expect(formatted).toEqual([]);
    });

    describe('void tags', () => {
        it('formats void tags', () => {
            const rawStr = 'cat <img/> float';
            const formatted = formatter(rawStr, {
                img: '<img src="#"/>',
            });

            expect(formatted).toEqual(['cat ', '<img src="#"/>', ' float']);
        });
    });
});
