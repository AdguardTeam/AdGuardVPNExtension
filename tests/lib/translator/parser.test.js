import { parser } from '../../../src/lib/translator/parser';

describe('parser', () => {
    it('parses', () => {
        const str = 'String to translate';
        const expectedAst = [{ type: 'text', value: str }];
        expect(parser(str)).toEqual(expectedAst);
    });

    it('parses tags', () => {
        const str = 'String to <a>translate</a>';
        const expectedAst = [
            {
                type: 'text',
                value: 'String to ',
            },
            {
                type: 'tag',
                value: 'a',
                children: [{ type: 'text', value: 'translate' }],
            }];
        expect(parser(str)).toEqual(expectedAst);
    });

    it('parses included tags', () => {
        const str = 'String with a link <a>link <b>with bold</b> content</a> and some text after';
        const expectedAst = [
            { type: 'text', value: 'String with a link ' },
            {
                type: 'tag',
                value: 'a',
                children: [
                    { type: 'text', value: 'link ' },
                    {
                        type: 'tag',
                        value: 'b',
                        children: [{ type: 'text', value: 'with bold' }],
                    },
                    { type: 'text', value: ' content' },
                ],
            },
            { type: 'text', value: ' and some text after' },
        ];

        expect(parser(str)).toEqual(expectedAst);
    });

    it('ignores open braces between tags', () => {
        const str = '<abc>1 < 2</abc>';
        const expectedAst = [
            {
                type: 'tag',
                value: 'abc',
                children: [{ type: 'text', value: '1 < 2' }],
            },
        ];

        expect(parser(str)).toEqual(expectedAst);
    });

    it('ignores closing braces between tags', () => {
        const str = '<abc>1 > 2</abc>';
        const expectedAst = [
            {
                type: 'tag',
                value: 'abc',
                children: [{ type: 'text', value: '1 > 2' }],
            },
        ];

        expect(parser(str)).toEqual(expectedAst);
    });

    it('ignores open braces in children tags', () => {
        const str = 'some text <a>text < in a<b>< 2</b></a>';
        const expectedAst = [
            { type: 'text', value: 'some text ' },
            {
                type: 'tag',
                value: 'a',
                children: [
                    { type: 'text', value: 'text < in a' },
                    { type: 'tag', value: 'b', children: [{ type: 'text', value: '< 2' }] },
                ],
            },
        ];

        expect(parser(str)).toEqual(expectedAst);
    });

    it('throws error if tag is not balanced', () => {
        const str = 'text <a>';
        expect(() => {
            parser(str);
        }).toThrow('String has unbalanced tags');
    });
});
