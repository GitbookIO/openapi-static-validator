import { namedTypes, builders } from 'ast-types';

import { Compiler, ValidationErrorIdentifier } from './compiler';
import {
    OpenAPIAnyOfSchema,
    OpenAPINumberSchema,
    OpenAPIObjectSchema,
    OpenAPIStringSchema,
    OpenAPIValueSchema,
} from './types';

export function compileValueSchema(compiler: Compiler, schema: OpenAPIValueSchema) {
    if ('anyOf' in schema) {
        return compileAnyOfSchema(compiler, schema);
    }

    if ('type' in schema) {
        switch (schema.type) {
            case 'object':
                return compileObjectSchema(compiler, schema);
            case 'number':
                return compileNumberSchema(compiler, schema);
            case 'string':
                return compileStringSchema(compiler, schema);
        }
    }

    throw new Error(`Unsupported schema: ${JSON.stringify(schema)}`);
}

function compileAnyOfSchema(compiler: Compiler, schema: OpenAPIAnyOfSchema) {
    return compiler.defineValidationFunction(schema, ({ value, path, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];

        schema.anyOf.forEach((subSchema, index) => {
            const fnIdentifier = compileValueSchema(compiler, subSchema);

            builders.identifier(`value${index}`);

            const identifier = builders.identifier(`value${index}`);

            nodes.push(
                builders.variableDeclaration('const', [
                    builders.variableDeclarator(
                        identifier,
                        builders.callExpression(fnIdentifier, [path, value]),
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

        nodes.push(builders.returnStatement(error('Expected one of the anyOf schemas to match')));

        return nodes;
    });
}

function compileObjectSchema(compiler: Compiler, schema: OpenAPIObjectSchema) {
    return compiler.defineValidationFunction(schema, ({ path, value, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];

        // Define a variable to be all the keys in `value`
        const keysIdentifier = builders.identifier('keys');

        nodes.push(
            builders.variableDeclaration('const', [
                builders.variableDeclarator(
                    keysIdentifier,
                    builders.callExpression(
                        builders.memberExpression(
                            builders.identifier('Object'),
                            builders.identifier('keys'),
                        ),
                        [value],
                    ),
                ),
            ]),
        );

        // if (schema.required?.length) {
        //     schema.required.forEach((requiredKey) => {
        //         nodes.push(
        //             builders.ifStatement(
        //                 builders.unaryExpression(
        //                     '!',
        //                     builders.callExpression(
        //                         builders.memberExpression(
        //                             keysIdentifier,
        //                             builders.identifier('includes'),
        //                         ),
        //                         [builders.literal(requiredKey)],
        //                     ),
        //                 ),
        //                 builders.blockStatement([
        //                     builders.returnStatement(
        //                         error(`Expected "${requiredKey}" to be defined`),
        //                     ),
        //                 ]),
        //             ),
        //         );
        //     });
        // }

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
                        ]),
                    ),
                ]),
                builders.ifStatement(
                    builders.binaryExpression(
                        'instanceof',
                        resultIdentifier,
                        ValidationErrorIdentifier,
                    ),
                    builders.blockStatement([builders.returnStatement(resultIdentifier)]),
                ),
                builders.expressionStatement(
                    builders.assignmentExpression(
                        '=',
                        builders.memberExpression(value, propNameLiteral),
                        resultIdentifier,
                    ),
                ),
            ];

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
                              builders.returnStatement(error(`Expected "${key}" to be defined`)),
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

        nodes.push(builders.returnStatement(value));

        return nodes;
    });
}

function compileNumberSchema(compiler: Compiler, schema: OpenAPINumberSchema) {
    return compiler.defineValidationFunction(schema, ({ value, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];

        nodes.push(
            builders.ifStatement(
                builders.unaryExpression(
                    '!',
                    builders.binaryExpression(
                        '===',
                        builders.unaryExpression('typeof', value),
                        builders.literal('number'),
                    ),
                ),
                builders.blockStatement([builders.returnStatement(error('Expected a number'))]),
            ),
        );

        nodes.push(builders.returnStatement(value));

        return nodes;
    });
}

function compileStringSchema(compiler: Compiler, schema: OpenAPIStringSchema) {
    return compiler.defineValidationFunction(schema, ({ value, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];

        nodes.push(
            builders.ifStatement(
                builders.unaryExpression(
                    '!',
                    builders.binaryExpression(
                        '===',
                        builders.unaryExpression('typeof', value),
                        builders.literal('number'),
                    ),
                ),
                builders.blockStatement([builders.returnStatement(error('Expected a number'))]),
            ),
        );

        nodes.push(builders.returnStatement(value));

        return nodes;
    });
}
