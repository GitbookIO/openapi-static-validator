import { namedTypes, builders } from 'ast-types';
import { pathToRegexp, Key } from 'path-to-regexp';

import { Compiler } from './compiler';
import { OpenAPISpec } from './types';
import { compilePath } from './compilePath';
import { ValidationErrorIdentifier } from './error';

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

    const nodes: namedTypes.Program['body'] = [];
    const functionNodes: namedTypes.FunctionDeclaration['body']['body'] = [];

    Object.entries(spec.paths ?? {}).map(([path, pathOperations], index) => {
        const keys: Key[] = [];
        const regex = pathToRegexp(path);

        const operationFn = compilePath(compiler, pathOperations);

        // Declare the regexp globally to avoid recompiling it at each execution
        const regexpIdentifier = builders.identifier(`pathRegexp${index}`);
        nodes.push(
            builders.variableDeclaration('const', [
                builders.variableDeclarator(
                    regexpIdentifier,
                    builders.newExpression(builders.identifier('RegExp'), [
                        builders.literal(regex.source),
                        builders.literal(regex.flags),
                    ]),
                ),
            ]),
        );

        // In the function, evaluate the regexp against the path
        functionNodes.push(
            builders.ifStatement(
                builders.binaryExpression(
                    '===',
                    builders.callExpression(
                        builders.memberExpression(regexpIdentifier, builders.identifier('test')),
                        [builders.memberExpression(request, builders.identifier('path'))],
                    ),
                    builders.literal(true),
                ),
                builders.blockStatement([
                    builders.returnStatement(
                        builders.callExpression(operationFn, [
                            builders.arrayExpression([]),
                            request,
                            context,
                        ]),
                    ),
                ]),
            ),
        );
    });

    // Otherwise, return an error
    functionNodes.push(
        builders.returnStatement(
            builders.newExpression(ValidationErrorIdentifier, [
                builders.arrayExpression([]),
                builders.literal('no operation match path'),
            ]),
        ),
    );

    nodes.push(
        builders.exportNamedDeclaration(
            builders.functionDeclaration(
                builders.identifier('validateRequest'),
                [request, context],
                builders.blockStatement(functionNodes),
            ),
        ),
    );

    return nodes;
}
