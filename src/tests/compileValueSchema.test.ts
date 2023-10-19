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

describe('Nullable', () => {
    test('nullable: true', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'number',
            nullable: true,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });
});

describe('String', () => {
    test('with enum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'string',
            enum: ['a', 'b', 'c']
        });
        console.log(compiler.compile());
        expect(compiler.compile()).toMatchSnapshot();
    });
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
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('as free form object', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'object',
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('with additionalProperties: true', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'object',
            properties: {
                foo: {
                    type: 'number',
                    default: 10,
                },
            },
            additionalProperties: true,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('with additionalProperties: {}', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'object',
            properties: {
                foo: {
                    type: 'number',
                    default: 10,
                },
            },
            additionalProperties: {
                type: 'string',
            },
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('with minProperties/maxProperties', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'object',
            minProperties: 1,
            maxProperties: 10,
        });
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
