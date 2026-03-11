import { expect, test } from 'bun:test';
import { Compiler } from '../compiler';
import type { OpenAPISpec } from '../types';

type ValidateRequest = (request: {
    method: string;
    path: string;
    query: Record<string, string | string[]>;
    headers: Record<string, string>;
    body?: unknown;
}) => {
    operationId?: string;
    query: Record<string, unknown>;
};

function buildSpec(): OpenAPISpec {
    return {
        paths: {
            '/inline-array': {
                get: {
                    operationId: 'inlineArray',
                    parameters: [
                        {
                            name: 'addons',
                            in: 'query',
                            schema: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                },
                            },
                        },
                    ],
                },
            },
            '/ref-array': {
                get: {
                    operationId: 'refArray',
                    parameters: [
                        {
                            name: 'addons',
                            in: 'query',
                            schema: {
                                $ref: '#/components/schemas/AddonsQuery',
                            },
                        },
                    ],
                },
            },
            '/non-array': {
                get: {
                    operationId: 'nonArray',
                    parameters: [
                        {
                            name: 'addons',
                            in: 'query',
                            schema: {
                                type: 'string',
                            },
                        },
                    ],
                },
            },
        },
        components: {
            schemas: {
                AddonsQuery: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                },
            },
        },
    };
}

function compileValidator(spec: OpenAPISpec) {
    const code = new Compiler(spec).compile();
    const runtimeCode = code.replace(/^export /gm, '');
    const factory = new Function(`${runtimeCode}\nreturn { validateRequest };`) as () => {
        validateRequest: ValidateRequest;
    };

    return {
        code,
        validateRequest: factory().validateRequest,
    };
}

test('query string is coerced to array for inline array schema', () => {
    const { validateRequest } = compileValidator(buildSpec());
    const result = validateRequest({
        path: '/inline-array',
        method: 'get',
        headers: {},
        query: {
            addons: 'translation_words',
        },
    });

    expect(result.query).toEqual({ addons: ['translation_words'] });
});

test('query string is coerced to array for $ref array schema', () => {
    const { validateRequest } = compileValidator(buildSpec());
    const result = validateRequest({
        path: '/ref-array',
        method: 'get',
        headers: {},
        query: {
            addons: 'translation_words',
        },
    });

    expect(result.query).toEqual({ addons: ['translation_words'] });
});

test('query string is not coerced for non-array schema', () => {
    const { validateRequest } = compileValidator(buildSpec());
    const result = validateRequest({
        path: '/non-array',
        method: 'get',
        headers: {},
        query: {
            addons: 'translation_words',
        },
    });

    expect(result.query).toEqual({ addons: 'translation_words' });
});

test('compiled validator includes coercion for inline and $ref array schemas only', () => {
    const { code } = compileValidator(buildSpec());
    const coercionMatches = code.match(/queryParam0 = \[queryParam0\];/g) ?? [];

    expect(code).toContain("if (typeof queryParam0 === 'string')");
    expect(coercionMatches).toHaveLength(2);
});
