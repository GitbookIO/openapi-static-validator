import { namedTypes, builders } from 'ast-types';

import type { Compiler } from './compiler';
import {
    OpenAPIAllOfSchema,
    OpenAPIAnyOfSchema,
    OpenAPIArraySchema,
    OpenAPIBooleanSchema,
    OpenAPIEnumableSchema,
    OpenAPIIntegerSchema,
    OpenAPINullableSchema,
    OpenAPINumberSchema,
    OpenAPIObjectSchema,
    OpenAPIOneOfSchema,
    OpenAPIStringSchema,
    OpenAPIValueSchema,
} from './types';
import { ValidationErrorIdentifier } from './error';

/**
 * Compile a JSON schema into a validation function.
 */
export function compileValueSchema(compiler: Compiler, schema: OpenAPIValueSchema) {
    if ('$ref' in schema) {
        return compileValueSchema(compiler, compiler.resolveRef(schema));
    }

    if ('anyOf' in schema) {
        return compileAnyOfSchema(compiler, schema);
    }

    if ('oneOf' in schema) {
        return compileOneOfSchema(compiler, schema);
    }

    if ('allOf' in schema) {
        return compileAllOfSchema(compiler, schema);
    }

    if ('type' in schema) {
        switch (schema.type) {
            case 'object':
                return compileObjectSchema(compiler, schema);
            case 'integer':
            case 'number':
                return compileNumberSchema(compiler, schema);
            case 'string':
                return compileStringSchema(compiler, schema);
            case 'boolean':
                return compileBooleanSchema(compiler, schema);
            case 'array':
                return compileArraySchema(compiler, schema);
            default:
                throw new Error(`Unsupported schema: ${JSON.stringify(schema)}`);
        }
    }

    return compileAnySchema(compiler, schema);
}

function compileAnyOfSchema(compiler: Compiler, schema: OpenAPIAnyOfSchema) {
    return compiler.declareValidationFunction(schema, ({ value, path, context, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];

        schema.anyOf.forEach((subSchema, index) => {
            const fnIdentifier = compileValueSchema(compiler, subSchema);

            builders.identifier(`value${index}`);

            const identifier = builders.identifier(`value${index}`);

            nodes.push(
                builders.variableDeclaration('const', [
                    builders.variableDeclarator(
                        identifier,
                        builders.callExpression(fnIdentifier, [path, value, context]),
                    ),
                ]),
            );

            nodes.push(
                builders.ifStatement(
                    builders.unaryExpression(
                        '!',
                        builders.binaryExpression(
                            'instanceof',
                            identifier,
                            ValidationErrorIdentifier,
                        ),
                    ),
                    builders.blockStatement([builders.returnStatement(identifier)]),
                ),
            );
        });

        nodes.push(builders.returnStatement(error('expected one of the anyOf schemas to match')));

        return nodes;
    });
}

function compileOneOfSchema(compiler: Compiler, schema: OpenAPIOneOfSchema) {
    return compiler.declareValidationFunction(schema, ({ value, path, context, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];

        // Declare the variable to use as a result, then iterate over each schema
        const resultIdentifier = builders.identifier('result');
        nodes.push(
            builders.variableDeclaration('let', [builders.variableDeclarator(resultIdentifier)]),
        );

        schema.oneOf.forEach((subSchema, index) => {
            const fnIdentifier = compileValueSchema(compiler, subSchema);
            const altIdentifier = builders.identifier(`alt${index}`);

            // Allocate a variable for the result of the schema alternative
            nodes.push(
                builders.variableDeclaration('const', [
                    builders.variableDeclarator(
                        altIdentifier,
                        builders.callExpression(fnIdentifier, [path, value, context]),
                    ),
                ]),
            );

            nodes.push(
                builders.ifStatement(
                    builders.unaryExpression(
                        '!',
                        builders.binaryExpression(
                            'instanceof',
                            altIdentifier,
                            ValidationErrorIdentifier,
                        ),
                    ),
                    builders.blockStatement([
                        ...(index > 0
                            ? [
                                  builders.ifStatement(
                                      builders.binaryExpression(
                                          '!==',
                                          resultIdentifier,
                                          builders.identifier('undefined'),
                                      ),
                                      builders.blockStatement([
                                          builders.returnStatement(
                                              error('expected to only match one of the schemas'),
                                          ),
                                      ]),
                                  ),
                              ]
                            : []),
                        builders.expressionStatement(
                            builders.assignmentExpression('=', resultIdentifier, altIdentifier),
                        ),
                    ]),
                ),
            );
        });

        nodes.push(
            builders.ifStatement(
                builders.binaryExpression(
                    '===',
                    resultIdentifier,
                    builders.identifier('undefined'),
                ),
                builders.blockStatement([builders.returnStatement(error('expected to match one'))]),
            ),
        );

        nodes.push(builders.returnStatement(resultIdentifier));

        return nodes;
    });
}

function compileAllOfSchema(compiler: Compiler, schema: OpenAPIAllOfSchema) {
    return compiler.declareValidationFunction(schema, ({ value, path, context, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];

        const resultIdentifier = builders.identifier('result');
        nodes.push(
            builders.variableDeclaration('let', [
                builders.variableDeclarator(resultIdentifier, value),
            ]),
        );

        schema.allOf.forEach((subSchema, index) => {
            const fnIdentifier = compileValueSchema(compiler, subSchema);

            nodes.push(
                builders.expressionStatement(
                    builders.assignmentExpression(
                        '=',
                        resultIdentifier,
                        builders.callExpression(fnIdentifier, [path, resultIdentifier, context]),
                    ),
                ),
            );

            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        'instanceof',
                        resultIdentifier,
                        ValidationErrorIdentifier,
                    ),
                    builders.blockStatement([builders.returnStatement(resultIdentifier)]),
                ),
            );
        });

        nodes.push(builders.returnStatement(resultIdentifier));

        return nodes;
    });
}

function compileObjectSchema(compiler: Compiler, schema: OpenAPIObjectSchema) {
    return compiler.declareValidationFunction(schema, ({ path, value, context, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];
        const endNodes: namedTypes.BlockStatement['body'] = [];

        nodes.push(...compileNullableCheck(compiler, schema, value));

        nodes.push(
            builders.ifStatement(
                builders.logicalExpression(
                    '||',
                    builders.binaryExpression(
                        '!==',
                        builders.unaryExpression('typeof', value),
                        builders.literal('object'),
                    ),
                    builders.binaryExpression('===', value, builders.literal(null)),
                ),
                builders.blockStatement([builders.returnStatement(error('expected an object'))]),
            ),
        );

        // Define a variable to be all the keys in `value`
        const keysIdentifier = builders.identifier('keys');

        // Create a Set of all keys
        nodes.push(
            builders.variableDeclaration('const', [
                builders.variableDeclarator(
                    keysIdentifier,
                    builders.newExpression(builders.identifier('Set'), [
                        builders.callExpression(
                            builders.memberExpression(
                                builders.identifier('Object'),
                                builders.identifier('keys'),
                            ),
                            [value],
                        ),
                    ]),
                ),
            ]),
        );

        if (schema.minProperties) {
            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        '<',
                        builders.memberExpression(keysIdentifier, builders.identifier('size')),
                        builders.literal(schema.minProperties),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(
                            error(`expected at least ${schema.minProperties} properties`),
                        ),
                    ]),
                ),
            );
        }

        if (schema.maxProperties) {
            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        '>',
                        builders.memberExpression(keysIdentifier, builders.identifier('size')),
                        builders.literal(schema.maxProperties),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(
                            error(`expected at most ${schema.maxProperties} properties`),
                        ),
                    ]),
                ),
            );
        }

        Object.entries(schema.properties ?? {}).forEach(([key, subSchema], index) => {
            const subValueIdentifier = builders.identifier(`value${index}`);
            const resultIdentifier = builders.identifier(`result${index}`);

            const fnIdentifier = compileValueSchema(compiler, subSchema);
            const propNameLiteral = builders.literal(key);

            nodes.push(
                builders.variableDeclaration('const', [
                    builders.variableDeclarator(
                        subValueIdentifier,
                        builders.memberExpression(value, propNameLiteral),
                    ),
                ]),
            );

            // Check that the value is valid for the sub-schema
            const check = [
                builders.variableDeclaration('const', [
                    builders.variableDeclarator(
                        resultIdentifier,
                        builders.callExpression(fnIdentifier, [
                            builders.arrayExpression([
                                builders.spreadElement(path),
                                propNameLiteral,
                            ]),
                            subValueIdentifier,
                            context,
                        ]),
                    ),
                ]),

                // If the result is not an error, then return it
                builders.ifStatement(
                    builders.binaryExpression(
                        'instanceof',
                        resultIdentifier,
                        ValidationErrorIdentifier,
                    ),
                    builders.blockStatement([builders.returnStatement(resultIdentifier)]),
                ),
                // Otherwise, assign it to the value
                builders.expressionStatement(
                    builders.assignmentExpression(
                        '=',
                        builders.memberExpression(value, propNameLiteral),
                        resultIdentifier,
                    ),
                ),
            ];

            // Remove the key from the keys set
            check.push(
                builders.expressionStatement(
                    builders.callExpression(
                        builders.memberExpression(keysIdentifier, builders.identifier('delete')),
                        [propNameLiteral],
                    ),
                ),
            );

            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        '!==',
                        subValueIdentifier,
                        builders.identifier('undefined'),
                    ),
                    builders.blockStatement(check),
                    schema.required?.includes(key)
                        ? builders.blockStatement([
                              builders.returnStatement(error(`expected "${key}" to be defined`)),
                          ])
                        : subSchema.default !== undefined
                        ? builders.blockStatement([
                              builders.expressionStatement(
                                  builders.assignmentExpression(
                                      '=',
                                      builders.memberExpression(value, propNameLiteral),
                                      builders.literal(subSchema.default),
                                  ),
                              ),
                          ])
                        : null,
                ),
            );
        });

        // No additional properties are allowed
        if (schema.additionalProperties === false) {
            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        '>',
                        builders.memberExpression(keysIdentifier, builders.identifier('size')),
                        builders.literal(0),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(error(`unexpected additional properties`)),
                    ]),
                ),
            );
        } else if (schema.additionalProperties && schema.additionalProperties !== true) {
            nodes.push(
                builders.forOfStatement(
                    builders.variableDeclaration('const', [
                        builders.variableDeclarator(builders.identifier('key')),
                    ]),
                    keysIdentifier,
                    builders.blockStatement([
                        builders.variableDeclaration('const', [
                            builders.variableDeclarator(
                                builders.identifier('result'),
                                builders.callExpression(
                                    compileValueSchema(compiler, schema.additionalProperties),
                                    [
                                        builders.arrayExpression([
                                            builders.spreadElement(path),
                                            builders.identifier('key'),
                                        ]),
                                        builders.memberExpression.from({
                                            object: value,
                                            property: builders.identifier('key'),
                                            computed: true,
                                        }),
                                        context,
                                    ],
                                ),
                            ),
                        ]),

                        builders.ifStatement(
                            builders.binaryExpression(
                                'instanceof',
                                builders.identifier('result'),
                                ValidationErrorIdentifier,
                            ),
                            builders.blockStatement([
                                builders.returnStatement(builders.identifier('result')),
                            ]),
                        ),

                        builders.expressionStatement(
                            builders.assignmentExpression(
                                '=',
                                builders.memberExpression.from({
                                    object: value,
                                    property: builders.identifier('key'),
                                    computed: true,
                                }),
                                builders.identifier('result'),
                            ),
                        ),
                    ]),
                ),
            );
        }

        nodes.push(builders.returnStatement(value));

        return [...nodes, ...endNodes];
    });
}

function compileArraySchema(compiler: Compiler, schema: OpenAPIArraySchema) {
    return compiler.declareValidationFunction(schema, ({ path, value, context, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];

        nodes.push(...compileNullableCheck(compiler, schema, value));

        nodes.push(
            builders.ifStatement(
                builders.unaryExpression(
                    '!',
                    builders.callExpression(
                        builders.memberExpression(
                            builders.identifier('Array'),
                            builders.identifier('isArray'),
                        ),
                        [value],
                    ),
                ),
                builders.blockStatement([builders.returnStatement(error('expected an array'))]),
            ),
        );

        if (schema.minItems) {
            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        '<',
                        builders.memberExpression(value, builders.identifier('length')),
                        builders.literal(schema.minItems),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(
                            error(`expected at least ${schema.minItems} items`),
                        ),
                    ]),
                ),
            );
        }

        if (schema.maxItems) {
            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        '>',
                        builders.memberExpression(value, builders.identifier('length')),
                        builders.literal(schema.maxItems),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(
                            error(`expected at most ${schema.maxItems} items`),
                        ),
                    ]),
                ),
            );
        }

        const valueSet = builders.identifier('valueSet');

        if (schema.uniqueItems) {
            nodes.push(
                builders.variableDeclaration('const', [
                    builders.variableDeclarator(
                        valueSet,
                        builders.newExpression(builders.identifier('Set'), []),
                    ),
                ]),
            );
        }

        const index = builders.identifier('i');
        const itemResult = builders.identifier('itemResult');
        const fnSchema = compileValueSchema(compiler, schema.items);

        nodes.push(
            builders.forStatement(
                builders.variableDeclaration('let', [
                    builders.variableDeclarator(index, builders.literal(0)),
                ]),
                builders.binaryExpression(
                    '<',
                    index,
                    builders.memberExpression(value, builders.identifier('length')),
                ),
                builders.updateExpression('++', index, false),
                builders.blockStatement([
                    builders.variableDeclaration('const', [
                        builders.variableDeclarator(
                            itemResult,
                            builders.callExpression(fnSchema, [
                                builders.arrayExpression([builders.spreadElement(path), index]),
                                builders.memberExpression(value, index, true),
                                context,
                            ]),
                        ),
                    ]),
                    ...(schema.uniqueItems
                        ? [
                              builders.ifStatement(
                                  builders.callExpression(
                                      builders.memberExpression(
                                          valueSet,
                                          builders.identifier('has'),
                                      ),
                                      [itemResult],
                                  ),
                                  builders.blockStatement([
                                      builders.returnStatement(error(`expected unique items`)),
                                  ]),
                              ),
                              builders.expressionStatement(
                                  builders.callExpression(
                                      builders.memberExpression(
                                          valueSet,
                                          builders.identifier('add'),
                                      ),
                                      [itemResult],
                                  ),
                              ),
                          ]
                        : []),
                    builders.ifStatement(
                        builders.binaryExpression(
                            'instanceof',
                            itemResult,
                            ValidationErrorIdentifier,
                        ),
                        builders.blockStatement([builders.returnStatement(itemResult)]),
                    ),
                    builders.expressionStatement(
                        builders.assignmentExpression(
                            '=',
                            builders.memberExpression(value, index, true),
                            itemResult,
                        ),
                    ),
                ]),
            ),
        );

        nodes.push(builders.returnStatement(value));

        return nodes;
    });
}

function compileNumberSchema(
    compiler: Compiler,
    schema: OpenAPINumberSchema | OpenAPIIntegerSchema,
) {
    return compiler.declareValidationFunction(schema, ({ value, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];
        nodes.push(...compileNullableCheck(compiler, schema, value));

        const enumCheck = compileEnumableCheck(compiler, schema, value, error);
        if (enumCheck) {
            return [...nodes, ...enumCheck];
        }

        // Try to convert the value to a number
        nodes.push(
            builders.ifStatement(
                builders.binaryExpression(
                    '===',
                    builders.unaryExpression('typeof', value),
                    builders.literal('string'),
                ),
                builders.blockStatement([
                    builders.expressionStatement(
                        builders.assignmentExpression(
                            '=',
                            value,
                            builders.callExpression(builders.identifier('Number'), [value]),
                        ),
                    ),
                ]),
            ),
        );

        nodes.push(
            builders.ifStatement(
                builders.logicalExpression(
                    '||',
                    builders.binaryExpression(
                        '!==',
                        builders.unaryExpression('typeof', value),
                        builders.literal('number'),
                    ),
                    builders.callExpression(
                        builders.memberExpression(
                            builders.identifier('Number'),
                            builders.identifier('isNaN'),
                        ),
                        [value],
                    ),
                ),
                builders.blockStatement([builders.returnStatement(error('expected a number'))]),
            ),
        );

        if (schema.maximum !== undefined) {
            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        schema.exclusiveMaximum ? '>=' : '>',
                        value,
                        builders.literal(schema.maximum),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(error('value greater than maximum')),
                    ]),
                ),
            );
        }

        if (schema.minimum !== undefined) {
            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        schema.exclusiveMinimum ? '<=' : '<',
                        value,
                        builders.literal(schema.minimum),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(error('value less than minimum')),
                    ]),
                ),
            );
        }

        nodes.push(builders.returnStatement(value));

        return nodes;
    });
}

function compileStringSchema(compiler: Compiler, schema: OpenAPIStringSchema) {
    return compiler.declareValidationFunction(schema, ({ value, context, path, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];
        nodes.push(...compileNullableCheck(compiler, schema, value));

        const enumCheck = compileEnumableCheck(compiler, schema, value, error);
        if (enumCheck) {
            return [...nodes, ...enumCheck];
        }

        nodes.push(
            builders.ifStatement(
                builders.binaryExpression(
                    '!==',
                    builders.unaryExpression('typeof', value),
                    builders.literal('string'),
                ),
                builders.blockStatement([builders.returnStatement(error('expected a string'))]),
            ),
        );

        // Validate the format using the potential `context?.formatString?.[schema.format]`
        if (schema.format) {
            const formatResult = builders.identifier('formatResult');

            nodes.push(
                builders.variableDeclaration('const', [
                    builders.variableDeclarator(
                        formatResult,
                        builders.callExpression.from({
                            callee: builders.memberExpression.from({
                                object: builders.memberExpression.from({
                                    object: context,
                                    property: builders.identifier('stringFormats'),
                                    optional: true,
                                }),
                                property: builders.literal(schema.format),
                                computed: true,
                                optional: true,
                            }),
                            optional: true,
                            arguments: [value, path],
                        }),
                    ),
                ]),
            );

            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        'instanceof',
                        formatResult,
                        ValidationErrorIdentifier,
                    ),
                    builders.blockStatement([builders.returnStatement(formatResult)]),
                ),
            );
        }

        if (schema.minLength) {
            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        '<',
                        builders.memberExpression(value, builders.identifier('length')),
                        builders.literal(schema.minLength),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(
                            error(`expected at least ${schema.minLength} characters`),
                        ),
                    ]),
                ),
            );
        }

        if (schema.maxLength) {
            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        '>',
                        builders.memberExpression(value, builders.identifier('length')),
                        builders.literal(schema.maxLength),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(
                            error(`expected at most ${schema.maxLength} characters`),
                        ),
                    ]),
                ),
            );
        }

        if (schema.pattern) {
            const patternStr = schema.pattern;
            const patternRegexp = compiler.declareForInput(patternStr, (id) => {
                return builders.variableDeclaration('const', [
                    builders.variableDeclarator(
                        id,
                        builders.newExpression(builders.identifier('RegExp'), [
                            builders.literal(patternStr),
                        ]),
                    ),
                ]);
            });

            nodes.push(
                builders.ifStatement(
                    builders.unaryExpression(
                        '!',
                        builders.callExpression(
                            builders.memberExpression(patternRegexp, builders.identifier('test')),
                            [value],
                        ),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(
                            error(`expected to match the pattern "${schema.pattern}"`),
                        ),
                    ]),
                ),
            );
        }

        nodes.push(builders.returnStatement(value));

        return nodes;
    });
}

function compileBooleanSchema(compiler: Compiler, schema: OpenAPIBooleanSchema) {
    return compiler.declareValidationFunction(schema, ({ value, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];
        nodes.push(...compileNullableCheck(compiler, schema, value));

        const enumCheck = compileEnumableCheck(compiler, schema, value, error);
        if (enumCheck) {
            return [...nodes, ...enumCheck];
        }

        // Try to convert the value to a boolean
        nodes.push(
            builders.ifStatement(
                builders.binaryExpression('===', value, builders.literal('true')),
                builders.blockStatement([
                    builders.expressionStatement(
                        builders.assignmentExpression('=', value, builders.literal(true)),
                    ),
                ]),
            ),
        );
        nodes.push(
            builders.ifStatement(
                builders.binaryExpression('===', value, builders.literal('false')),
                builders.blockStatement([
                    builders.expressionStatement(
                        builders.assignmentExpression('=', value, builders.literal(false)),
                    ),
                ]),
            ),
        );

        nodes.push(
            builders.ifStatement(
                builders.binaryExpression(
                    '!==',
                    builders.unaryExpression('typeof', value),
                    builders.literal('boolean'),
                ),
                builders.blockStatement([builders.returnStatement(error('expected a boolean'))]),
            ),
        );

        nodes.push(builders.returnStatement(value));

        return nodes;
    });
}

function compileAnySchema(compiler: Compiler, schema: object) {
    return compiler.declareValidationFunction(schema, ({ value }) => {
        return [builders.returnStatement(value)];
    });
}

function compileNullableCheck(
    compiler: Compiler,
    schema: OpenAPINullableSchema,
    value: namedTypes.Identifier,
) {
    if (!schema.nullable) {
        return [];
    }

    return [
        builders.ifStatement(
            builders.binaryExpression('===', value, builders.literal(null)),
            builders.blockStatement([builders.returnStatement(value)]),
        ),
    ];
}

function compileEnumableCheck(
    compiler: Compiler,
    schema: OpenAPIEnumableSchema,
    value: namedTypes.Identifier,
    error: (message: string) => namedTypes.NewExpression,
) {
    if (!schema.enum) {
        return null;
    }

    return [
        builders.ifStatement(
            schema.enum.reduce(
                (acc, val) => {
                    const test = builders.binaryExpression('!==', value, builders.literal(val));

                    if (!acc) {
                        return test;
                    }

                    return builders.logicalExpression('&&', acc, test);
                },
                null as namedTypes.BinaryExpression | namedTypes.LogicalExpression | null,
            )!,
            builders.blockStatement([
                builders.returnStatement(error('expected one of the enum value')),
            ]),
        ),
        builders.returnStatement(value),
    ];
}
