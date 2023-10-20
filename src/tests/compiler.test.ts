import { expect, test } from 'bun:test';
import { Compiler } from '../compiler';

test('components ref', () => {
    const compiler = new Compiler({
        components: {
            schemas: {
                A: {
                    type: 'number',
                },
                B: {
                    type: 'object',
                    properties: {
                        foo: {
                            type: 'string',
                        },
                        bar: {
                            $ref: '#/components/schemas/A',
                        },
                    },
                },
            },
        },
    });
    compiler.indexAllComponents();
    expect(compiler.compile()).toMatchSnapshot();
});

test('recursive refs', () => {
    const compiler = new Compiler({
        components: {
            schemas: {
                A: {
                    type: 'number',
                },
                B: {
                    type: 'object',
                    properties: {
                        foo: {
                            type: 'string',
                        },
                        bar: {
                            $ref: '#/components/schemas/A',
                        },
                        rec: {
                            $ref: '#/components/schemas/B',
                        },
                    },
                },
            },
        },
    });
    compiler.indexAllComponents();
    expect(compiler.compile()).toMatchSnapshot();
});
