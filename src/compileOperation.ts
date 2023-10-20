import { namedTypes, builders } from 'ast-types';

import { Compiler } from './compiler';
import { OpenAPIOperation } from './types';
import { compileValueSchema } from './compileValueSchema';
import { ValidationErrorIdentifier, buildRequestError } from './error';
import { OpenAPIParsedPath, getPathParamIndex, openapiPathToRegex } from './paths';

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
export function compileOperation(
    compiler: Compiler,
    path: OpenAPIParsedPath,
    operation: OpenAPIOperation,
) {
    return compiler.declareForInput(operation, (functionId) => {
        const requestIdentifier = builders.identifier('request');
        const pathMatchIdentifier = builders.identifier('pathMatch');
        const contextIdentifier = builders.identifier('context');

        const nodes: namedTypes.BlockStatement['body'] = [];

        // Set the operationId on the request
        if (operation.operationId) {
            nodes.push(
                builders.expressionStatement(
                    builders.assignmentExpression(
                        '=',
                        builders.memberExpression(
                            requestIdentifier,
                            builders.identifier('operationId'),
                        ),
                        builders.literal(operation.operationId),
                    ),
                ),
            );
        }

        // Extract and validate path params
        const pathParameters = (operation.parameters ?? []).filter(
            (parameter) => compiler.resolveMaybeRef(parameter).in === 'path',
        );
        nodes.push(
            builders.expressionStatement(
                builders.assignmentExpression(
                    '=',
                    builders.memberExpression(requestIdentifier, builders.identifier('params')),
                    builders.objectExpression(
                        pathParameters
                            .map((refParameter, index) => {
                                const parameter = compiler.resolveMaybeRef(refParameter);

                                const identifier = builders.identifier(`pathParam${index}`);
                                const schemaFn = compileValueSchema(compiler, parameter.schema);
                                const regexMatchIndex = getPathParamIndex(path, parameter.name);

                                nodes.push(
                                    builders.variableDeclaration('const', [
                                        builders.variableDeclarator(
                                            identifier,
                                            builders.callExpression(schemaFn, [
                                                builders.arrayExpression([
                                                    builders.literal('path'),
                                                    builders.literal(parameter.name),
                                                ]),
                                                builders.memberExpression(
                                                    pathMatchIdentifier,
                                                    builders.literal(regexMatchIndex),
                                                    true,
                                                ),
                                                contextIdentifier,
                                            ]),
                                        ),
                                    ]),
                                );

                                // Return an error if the parameter is invalid
                                nodes.push(
                                    builders.ifStatement(
                                        builders.binaryExpression(
                                            'instanceof',
                                            identifier,
                                            ValidationErrorIdentifier,
                                        ),
                                        builders.blockStatement([
                                            builders.returnStatement(identifier),
                                        ]),
                                    ),
                                );

                                return builders.property(
                                    'init',
                                    builders.identifier(parameter.name),
                                    identifier,
                                );
                            })
                            .flat(),
                    ),
                ),
            ),
        );

        // Validate query parameters
        const queryParameters = (operation.parameters ?? []).filter(
            (parameter) => compiler.resolveMaybeRef(parameter).in === 'path',
        );
        queryParameters.forEach((parameter) => {});

        // Validate the body against the schema
        if (operation.requestBody) {
            if (operation.requestBody.required) {
                nodes.push(
                    builders.ifStatement(
                        builders.binaryExpression(
                            '===',
                            builders.memberExpression(
                                requestIdentifier,
                                builders.identifier('body'),
                            ),
                            builders.identifier('undefined'),
                        ),
                        builders.blockStatement([
                            builders.returnStatement(buildRequestError(400, 'body is required')),
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
                                builders.arrayExpression([builders.literal('body')]),
                                builders.memberExpression(
                                    requestIdentifier,
                                    builders.identifier('body'),
                                ),
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
                                    builders.memberExpression(
                                        requestIdentifier,
                                        builders.identifier('body'),
                                    ),
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
                        builders.memberExpression(requestIdentifier, builders.identifier('body')),
                        builders.identifier('undefined'),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(buildRequestError(400, 'body is not allowed')),
                    ]),
                ),
            );
        }

        nodes.push(builders.returnStatement(requestIdentifier));

        return builders.functionDeclaration(
            functionId,
            [requestIdentifier, pathMatchIdentifier, contextIdentifier],
            builders.blockStatement(nodes),
        );
    });
}
