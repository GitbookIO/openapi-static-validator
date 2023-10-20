import { namedTypes, builders } from 'ast-types';
import { pathToRegexp, Key } from 'path-to-regexp';

import { Compiler } from './compiler';
import { OpenAPISpec } from './types';
import { compilePath } from './compilePath';
import { buildValidationError } from './error';

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
        const operationFn = compilePath(compiler, pathOperations);

        // Declare the regexp globally to avoid recompiling it at each execution
        const regexpIdentifier = compilePathRegexp(compiler, path)

        const matchIdentifier = builders.identifier(`match${index}`);

        // In the function, evaluate the regexp against the path
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
function compilePathRegexp(compiler: Compiler, path: string) {
    return compiler.declareForInput(path, (id) => {
        const { regex } = openapiPathToRegex(path);

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

/**
 * Compile an OpenAPI path to a regex.
 */
export function openapiPathToRegex(path: string): {
    regex: RegExp;
    keys: Key[];
} {
    // Normalize the path to convert {param} as :param
    const rxPathParam = /{([^}]+)}/;
    while (rxPathParam.test(path)) {
        path = path.replace(rxPathParam, ':$1');
    }

    const keys: Key[] = [];
    const regex = pathToRegexp(path, keys);
    return { regex, keys };
}
