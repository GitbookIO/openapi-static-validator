import { namedTypes, builders } from 'ast-types';

import { Compiler } from './compiler';
import { OpenAPISpec } from './types';
import { compilePath } from './compilePath';
import { buildValidationError } from './error';
import { OpenAPIParsedPath, openapiPathToRegex } from './paths';

/**
 * Compile a request validation function.
 * The request input is an object:
 * {
 *   path: string;
 *   method: string;
 *   body: any;
 *   query: Record<string, string>;
 *   headers: any;
 * }
 *
 * The result is the same object with added properties:
 *  - operationId: string
 *  - params: Record<string, string>
 */
export function compileValidateRequest(compiler: Compiler, spec: OpenAPISpec) {
    const request = builders.identifier('request');
    const context = builders.identifier('context');

    const nodes: namedTypes.FunctionDeclaration['body']['body'] = [];

    Object.entries(spec.paths ?? {}).map(([path, pathOperations], index) => {
        const parsedPath = openapiPathToRegex(path);
        const operationFn = compilePath(compiler, parsedPath, pathOperations);

        // Declare the regexp globally to avoid recompiling it at each execution
        const regexpIdentifier = compilePathRegexp(compiler, path, parsedPath)

        // In the function, evaluate the regexp against the path
        const matchIdentifier = builders.identifier(`match${index}`);
        nodes.push(
            builders.variableDeclaration('const', [
                builders.variableDeclarator(
                    matchIdentifier,
                    builders.callExpression(
                        builders.memberExpression(
                            builders.memberExpression(request, builders.identifier('path')),
                            builders.identifier('match'),
                        ),
                        [regexpIdentifier],
                    ),
                ),
            ]),
        )
        nodes.push(
            builders.ifStatement(
                builders.binaryExpression(
                    '!==',
                    matchIdentifier,
                    builders.literal(null),
                ),
                builders.blockStatement([
                    builders.returnStatement(
                        builders.callExpression(operationFn, [
                            request,
                            matchIdentifier,
                            context,
                        ]),
                    ),
                ]),
            ),
        );
    });

    // Otherwise, return an error
    nodes.push(
        builders.returnStatement(
            buildValidationError('no operation match path'),
        ),
    );

    return [
        builders.exportNamedDeclaration(
            builders.functionDeclaration(
                builders.identifier('validateRequest'),
                [request, context],
                builders.blockStatement(nodes),
            ),
        )
    ];
}

/**
 * Compile a path to a regex identifier.
 */
function compilePathRegexp(compiler: Compiler, path: string, parsed: OpenAPIParsedPath) {
    return compiler.declareForInput(path, (id) => {
        const { regex } = parsed;

        return builders.variableDeclaration('const', [
            builders.variableDeclarator(
                id,
                builders.newExpression(builders.identifier('RegExp'), [
                    builders.literal(regex.source),
                    builders.literal(regex.flags),
                ]),
            ),
        ])
    });
}
