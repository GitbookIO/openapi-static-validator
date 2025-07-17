import { describe, expect, test } from 'bun:test';
import { Compiler } from '../compiler';
import { compileValueSchema } from '../compileValueSchema';

describe('Number', () => {
    test('basic', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'number',
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('maximum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'number',
            maximum: 10,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('maximum exclusiveMaximum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'number',
            maximum: 10,
            exclusiveMaximum: true,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('minimum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'number',
            minimum: 10,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('minimim exclusiveMinimum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'number',
            minimum: 10,
            exclusiveMinimum: true,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('negative maximum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'number',
            maximum: -5,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('negative minimum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'number',
            minimum: -10,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('negative maximum exclusiveMaximum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'number',
            maximum: -5,
            exclusiveMaximum: true,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('negative minimum exclusiveMinimum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'number',
            minimum: -10,
            exclusiveMinimum: true,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });
});

describe('Integer', () => {
    test('basic', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'integer',
            format: 'int32',
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('negative', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'integer',
            enum: [-1, 0, 1],
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('negative maximum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'integer',
            maximum: -5,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('negative minimum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'integer',
            minimum: -10,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('negative maximum exclusiveMaximum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'integer',
            maximum: -5,
            exclusiveMaximum: true,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('negative minimum exclusiveMinimum', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'integer',
            minimum: -10,
            exclusiveMinimum: true,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });
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
            enum: ['a', 'b', 'c'],
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('with pattern', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'string',
            pattern: '^[a-z]+$',
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('with pattern', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'string',
            format: 'uri',
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('with format', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'string',
            format: 'uri',
        });
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

describe('Array', () => {
    test('minItems / maxItems', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'array',
            items: {
                type: 'string',
            },
            minItems: 1,
            maxItems: 10,
        });
        expect(compiler.compile()).toMatchSnapshot();
    });

    test('uniqueItems', () => {
        const compiler = new Compiler();
        compileValueSchema(compiler, {
            type: 'array',
            items: {
                type: 'string',
            },
            uniqueItems: true,
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

test('oneOf', () => {
    const compiler = new Compiler();
    compileValueSchema(compiler, {
        oneOf: [
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

test('allOf', () => {
    const compiler = new Compiler();
    compileValueSchema(compiler, {
        allOf: [
            {
                type: 'object',
                properties: {
                    a: { type: 'number' },
                },
            },
            {
                type: 'object',
                properties: {
                    b: { type: 'string' },
                },
            },
        ],
    });
    expect(compiler.compile()).toMatchSnapshot();
});
