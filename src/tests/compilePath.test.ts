import { Compiler } from '../compiler';
import { compilePath } from '../compilePath';

test('with get and post', () => {
    const compiler = new Compiler();
    compilePath(compiler, {
        get: {
            parameters: [
                {
                    name: 'foo',
                    in: 'query',
                    schema: {
                        type: 'number',
                    },
                },
            ],
        },
        post: {
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                foo: {
                                    type: 'number',
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    expect(compiler.compile()).toMatchSnapshot();
});
