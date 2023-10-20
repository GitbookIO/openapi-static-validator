import { Compiler } from '../compiler';
import { compileOperation } from '../compileOperation';

describe('With body', () => {
    test('without', () => {
        const compiler = new Compiler();
        compileOperation(compiler, {});
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('required', () => {
        const compiler = new Compiler();
        compileOperation(compiler, {
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
        });
        expect(compiler.compile()).toMatchSnapshot();
    });
});
