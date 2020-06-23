import { parser } from '../../../src/lib/translator/parser';

describe('parser', () => {
    it('parses', () => {
        const str = 'String to translate';
        const expectedAst = [{ type: 'text', value: str }];
        expect(parser(str)).toEqual(expectedAst);
    });

    it('parses empty string into empty ast', () => {
        const str = '';
        const expectedAst = [];
        expect(parser(str)).toEqual(expectedAst);
    });

    it('parses text with <', () => {
        const str = 'text < abc';
        const expectedAst = [{ type: 'text', value: 'text < abc' }];
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

    describe('placeholders', () => {
        it('parses placeholders in the beginning', () => {
            const str = '%replaceable% with text';
            const expectedAst = [{ type: 'placeholder', value: 'replaceable' }, { type: 'text', value: ' with text' }];
            expect(parser(str)).toEqual(expectedAst);
        });

        it('parses placeholders in the end', () => {
            const str = 'text with %replaceable%';
            const expectedAst = [{ type: 'text', value: 'text with ' }, { type: 'placeholder', value: 'replaceable' }];
            expect(parser(str)).toEqual(expectedAst);
        });

        it('parses text with placeholder mark', () => {
            const str = 'text with % placeholder mark';
            const expectedAst = [{ type: 'text', value: 'text with % placeholder mark' }];
            expect(parser(str)).toEqual(expectedAst);
        });

        it('parses text with unbalanced placeholder mark', () => {
            const str = 'text with %replaceable% mark % text end';
            const expectedAst = [
                { type: 'text', value: 'text with ' },
                { type: 'placeholder', value: 'replaceable' },
                { type: 'text', value: ' mark % text end' },
            ];
            expect(parser(str)).toEqual(expectedAst);
        });

        it('double placeholder marks are considered as escape for %', () => {
            const str = 'text %% some %replaceable%';
            const expectedAst = [
                { type: 'text', value: 'text % some ' },
                { type: 'placeholder', value: 'replaceable' },
            ];
            expect(parser(str)).toEqual(expectedAst);
        });

        it('double placeholder marks are considered as escape for % 2', () => {
            const str = 'text %% some';
            const expectedAst = [
                { type: 'text', value: 'text % some' },
            ];
            expect(parser(str)).toEqual(expectedAst);
        });

        it('parses nested placeholders', () => {
            const str = 'text with <a>tag with %replaceable%</a>';
            const expectedAst = [
                { type: 'text', value: 'text with ' },
                {
                    type: 'tag',
                    value: 'a',
                    children: [
                        {
                            type: 'text',
                            value: 'tag with ',
                        }, {
                            type: 'placeholder',
                            value: 'replaceable',
                        }],
                },
            ];
            expect(parser(str)).toEqual(expectedAst);
        });
    });

    describe('void tags', () => {
        it('parses void tags as string', () => {
            const str = 'cat <img/> float';
            const expectedAst = [
                { type: 'text', value: 'cat ' },
                { type: 'tag', value: 'img' },
                { type: 'text', value: ' float' },
            ];
            expect(parser(str)).toEqual(expectedAst);
        });

        it('parses void tags as string with neighbors', () => {
            const str = 'cat <a><img/></a>';
            const expectedAst = [
                { type: 'text', value: 'cat ' },
                {
                    type: 'tag',
                    value: 'a',
                    children: [{ type: 'tag', value: 'img' }],
                },
            ];
            expect(parser(str)).toEqual(expectedAst);
        });
    });
});
