import { Compiler } from '../compiler';
import { compileValueSchema } from '../compileValueSchema';
import { OpenAPIValueSchema } from '../types';

test('number', () => {
    const compiler = new Compiler();
    compileValueSchema(compiler, {
        type: 'number',
    });
    expect(compiler.compile()).toMatchSnapshot();
});

describe('Objects', () => {
    test('with a required prop', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'object',
            properties: {
                foo: {
                    type: 'number',
                },
                bar: {
                    type: 'string',
                },
            },
            required: ['foo'],
        });
        console.log(compiler.compile());
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('with a default value', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'object',
            properties: {
                foo: {
                    type: 'number',
                    default: 10,
                },
            },
        });
        console.log(compiler.compile());
        expect(compiler.compile()).toMatchSnapshot();
    });
});

test('anyOf', () => {
    const compiler = new Compiler();
    compileValueSchema(compiler, {
        anyOf: [
            {
                type: 'number',
            },
            {
                type: 'string',
            },
        ],
    });
    expect(compiler.compile()).toMatchSnapshot();
});
