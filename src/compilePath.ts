import { namedTypes, builders } from 'ast-types';

import { Compiler } from './compiler';
import { OpenAPIPath } from './types';
import { compileOperation } from './compileOperation';
import { buildValidationError } from './error';
import { OpenAPIParsedPath } from './paths';

/**
 * Compile a path into a function.
 * The value input is an object:
 * {
 *   path: string;
 *   method: string;
 *   body: any;
 *   query: any;
 *   headers: any;
 * }
 */
export function compilePath(
    compiler: Compiler,
    path: OpenAPIParsedPath,
    pathOperations: OpenAPIPath
) {
    return compiler.declareForInput(pathOperations, (functionId) => {
        const requestIdentifier = builders.identifier('request');
        const pathMatchIdentifier = builders.identifier('pathMatch');
        const contextIdentifier = builders.identifier('context');

        const nodes: namedTypes.BlockStatement['body'] = [];

        Object.entries(pathOperations).forEach(([method, operation]) => {
            const fnOperation = compileOperation(compiler,path,  operation);

            nodes.push(
                builders.ifStatement(
                    builders.binaryExpression(
                        '===',
                        builders.memberExpression(requestIdentifier, builders.identifier('method')),
                        builders.literal(method),
                    ),
                    builders.blockStatement([
                        builders.returnStatement(
                            builders.callExpression(fnOperation, [requestIdentifier, pathMatchIdentifier, contextIdentifier]),
                        ),
                    ]),
                ),
            );
        });

        nodes.push(builders.returnStatement(buildValidationError('method not supported')));

        return builders.functionDeclaration(functionId,
            [
                requestIdentifier,
                pathMatchIdentifier,
                contextIdentifier,
            ],
            builders.blockStatement(nodes)
        )
    });
}
