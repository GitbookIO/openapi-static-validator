import { namedTypes, builders } from 'ast-types';

import { Compiler } from './compiler';
import { OpenAPIOperation } from './types';
import { compileValueSchema } from './compileValueSchema';
import { ValidationErrorIdentifier } from './error';

/**
 * Compile an operation into a function.
 * The value input is an object:
 * {
 *   path: string;
 *   method: string;
 *   body: any;
 *   query: any;
 *   headers: any;
 * }
 */
export function compileOperation(compiler: Compiler, operation: OpenAPIOperation) {
    return compiler.defineValidationFunction(operation, ({ value, path, error }) => {
        const nodes: namedTypes.BlockStatement['body'] = [];

        if (operation.operationId) {
            nodes.push(
                builders.expressionStatement(
                    builders.assignmentExpression(
                        '=',
                        builders.memberExpression(value, builders.identifier('operationId')),
                        builders.literal(operation.operationId),
                    ),
                ),
            );
        }

        if (operation.requestBody) {
            if (operation.requestBody.required) {
                nodes.push(
                    builders.ifStatement(
                        builders.binaryExpression(
                            '===',
                            builders.memberExpression(value, builders.identifier('body')),
                            builders.identifier('undefined'),
                        ),
                        builders.blockStatement([
                            builders.returnStatement(error('body is required')),
                        ]),
                    ),
                );
            }

            const contentTypeSchema = operation.requestBody.content?.['application/json']?.schema;
            if (contentTypeSchema) {
                const bodyFn = compileValueSchema(compiler, contentTypeSchema);
                const bodyResult = builders.identifier('body');

                nodes.push(
                    builders.variableDeclaration('const', [
                        builders.variableDeclarator(
                            bodyResult,
                            builders.callExpression(bodyFn, [
                                builders.arrayExpression([
                                    builders.spreadElement(path),
                                    builders.literal('body'),
                                ]),
                                builders.memberExpression(value, builders.identifier('body')),
                            ]),
                        ),
                    ]),
                );

                nodes.push(
                    builders.ifStatement(
                        builders.binaryExpression(
                            'instanceof',
                            bodyResult,
                            ValidationErrorIdentifier,
                        ),
                        builders.blockStatement([builders.returnStatement(bodyResult)]),
                        builders.blockStatement([
                            builders.expressionStatement(
                                builders.assignmentExpression(
                                    '=',
                                    builders.memberExpression(value, builders.identifier('body')),
                                    bodyResult,
                                ),
                            ),
                        ]),
                    ),
                );
            }
        } else {
            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        '!==',
                        builders.memberExpression(value, builders.identifier('body')),
                        builders.identifier('undefined'),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(error('body is not allowed')),
                    ]),
                ),
            );
        }

        nodes.push(builders.returnStatement(value));

        return nodes;
    });
}
