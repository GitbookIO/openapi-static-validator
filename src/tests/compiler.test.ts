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
    compiler.build();
    expect(compiler.compile()).toMatchSnapshot();
});
